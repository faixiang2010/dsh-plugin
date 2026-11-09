/** 每个会话的总结历史，保存在浏览器本地。 */

/** 一次模型总结的结果。 */
export interface SummaryEntry {
  /** 生成时已完成的对话轮次。 */
  readonly round: number
  /** 生成时间（毫秒）。 */
  readonly at: number
  /** 模型返回的 Markdown 要点。 */
  readonly summary: string
  readonly provider?: string
  readonly model?: string
}

/** 一个会话的持久化状态。 */
export interface SessionState {
  readonly v: 2
  /** 是否在出现新轮次时自动总结。 */
  readonly auto: boolean
  readonly entries: readonly SummaryEntry[]
}

const PREFIX = 'dsh.dawei-summary.v2:'
/** 最多保留的历史条数，避免本地存储无限膨胀。 */
const MAX_ENTRIES = 30

export const EMPTY_STATE: SessionState = { v: 2, auto: true, entries: [] }

function keyOf(sessionId: string): string {
  return `${PREFIX}${sessionId}`
}

/** 宽进：坏数据直接退回空状态。 */
function parse(raw: string | null): SessionState {
  if (raw === null || raw === '') return EMPTY_STATE
  try {
    const value = JSON.parse(raw) as Partial<SessionState>
    if (value.v !== 2 || !Array.isArray(value.entries)) return EMPTY_STATE
    const entries = value.entries.filter((entry): entry is SummaryEntry =>
      typeof entry?.round === 'number'
      && typeof entry.at === 'number'
      && typeof entry.summary === 'string')
    return { v: 2, auto: value.auto !== false, entries: entries.slice(-MAX_ENTRIES) }
  } catch {
    return EMPTY_STATE
  }
}

export function loadState(sessionId: string): SessionState {
  try {
    return parse(window.localStorage.getItem(keyOf(sessionId)))
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(sessionId: string, state: SessionState): void {
  try {
    const trimmed: SessionState = { ...state, entries: state.entries.slice(-MAX_ENTRIES) }
    window.localStorage.setItem(keyOf(sessionId), JSON.stringify(trimmed))
  } catch {
    /* 隐私模式等场景下只保留内存里的这一份。 */
  }
}

/** 追加一条总结；同一轮次重复生成时覆盖旧的那条。 */
export function appendEntry(state: SessionState, entry: SummaryEntry): SessionState {
  const kept = state.entries.filter(existing => existing.round < entry.round)
  return { ...state, entries: [...kept, entry].slice(-MAX_ENTRIES) }
}
