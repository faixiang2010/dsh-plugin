/**
 * 一个会话一个控制器：盯住事件窗口，发现新完成的轮次就请求宿主做一次
 * 整段会话的关键信息总结，并把结果落到本地。
 */
import { ROUTE_URL, type SummarizeRequest, type SummarizeResponse } from '../shared.ts'
import { appendEntry, loadState, saveState, type SessionState, type SummaryEntry } from './storage.ts'
import { buildTranscript } from './transcript.ts'

/** 面板读取的状态。 */
export interface SummaryState {
  readonly entries: readonly SummaryEntry[]
  readonly auto: boolean
  readonly running: boolean
  /** 当前已完成轮次。 */
  readonly rounds: number
  readonly error?: string
}

/** 注入给面板的能力。 */
export interface SummaryController {
  readonly hooks: { readonly summary: ObservableSnapshot<SummaryState> }
  readonly summarize: () => void
  readonly clear: () => void
  readonly setAuto: (auto: boolean) => void
}

/** 与 DSH 客户端一致的只读快照源形状。 */
export interface ObservableSnapshot<T> {
  getSnapshot: () => T
  subscribe: (listener: () => void) => () => void
}

/** 会话绑定里本插件用到的部分。 */
export interface BindingLike {
  readonly eventSource: {
    getSnapshot: () => { readonly entries: readonly unknown[]; readonly revision: number }
    subscribe: (listener: () => void) => () => void
  }
}

/** 同一会话复用同一个控制器，避免重复订阅与并发请求。 */
const controllers = new WeakMap<BindingLike, SummaryController>()

/** 流结束后静置这么久再总结，避开仍在追加的流式片段。 */
const SETTLE_MS = 2_000

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** 把宿主响应转成可展示的结果。 */
async function requestSummary(transcript: string, round: number): Promise<SummaryEntry> {
  const body: SummarizeRequest = { transcript, round }
  const response = await fetch(ROUTE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.status === 404) {
    throw new Error('宿主端未启用：插件需要以 bundle 方式安装并重载')
  }
  const payload = await response.json() as SummarizeResponse
  if (!response.ok || payload.ok !== true || typeof payload.summary !== 'string') {
    throw new Error(payload.error ?? `宿主返回 ${response.status}`)
  }
  return {
    round,
    at: Date.now(),
    summary: payload.summary,
    provider: payload.provider,
    model: payload.model,
  }
}

/** 会话 id 只用于本地存储分桶。 */
export function controllerFor(binding: BindingLike, sessionId: string): SummaryController {
  const cached = controllers.get(binding)
  if (cached !== undefined) return cached

  let persisted: SessionState = loadState(sessionId)
  let state: SummaryState = {
    entries: persisted.entries,
    auto: persisted.auto,
    running: false,
    rounds: 0,
  }
  const listeners = new Set<() => void>()
  const publish = (): void => { for (const listener of listeners) listener() }
  const update = (patch: Partial<SummaryState>): void => {
    state = { ...state, ...patch }
    publish()
  }

  let revision = -1
  let scheduled: ReturnType<typeof setTimeout> | undefined
  let inFlight = false

  const schedule = (): void => {
    if (scheduled !== undefined) clearTimeout(scheduled)
    scheduled = setTimeout(() => {
      scheduled = undefined
      if (!inFlight) run()
    }, SETTLE_MS)
  }

  const run = (): void => {
    if (inFlight) return
    const snapshot = binding.eventSource.getSnapshot()
    const transcript = buildTranscript(snapshot.entries as never)
    if (transcript.rounds <= 0 || transcript.text.trim() === '') {
      update({ error: '还没有可总结的对话' })
      return
    }
    inFlight = true
    update({ running: true, error: undefined })
    void requestSummary(transcript.text, transcript.rounds)
      .then((entry) => {
        persisted = appendEntry({ ...persisted, auto: state.auto }, entry)
        saveState(sessionId, persisted)
        update({ entries: persisted.entries, running: false })
      })
      .catch((error: unknown) => {
        update({ running: false, error: describeError(error) })
      })
      .finally(() => {
        inFlight = false
      })
  }

  const sync = (): void => {
    const snapshot = binding.eventSource.getSnapshot()
    if (snapshot.revision === revision) return
    revision = snapshot.revision
    const transcript = buildTranscript(snapshot.entries as never)
    const latest = persisted.entries[persisted.entries.length - 1]
    const behind = transcript.rounds > (latest?.round ?? 0)
    update({ rounds: transcript.rounds })
    if (state.auto && behind && transcript.rounds > 0) schedule()
  }

  const controller: SummaryController = {
    hooks: { summary: { getSnapshot: () => state, subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    } } },
    summarize: () => { run() },
    clear: () => {
      persisted = { ...persisted, entries: [] }
      saveState(sessionId, persisted)
      update({ entries: [], error: undefined })
    },
    setAuto: (auto) => {
      persisted = { ...persisted, auto }
      saveState(sessionId, persisted)
      update({ auto })
      if (auto) schedule()
    },
  }

  controllers.set(binding, controller)
  binding.eventSource.subscribe(sync)
  sync()
  return controller
}
