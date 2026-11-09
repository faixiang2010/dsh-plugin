/**
 * 宿主半边：提供 /api/dawei-summary/summarize，用会话里的模型把整段对话
 * 提炼成关键信息。浏览器半边只负责收集原文与展示，不接触模型调用。
 */
import { ROUTE_PATH, type SummarizeRequest, type SummarizeResponse } from './shared.ts'

export const name = 'deepseek-harness-content'

/** connection 提供路由注册；llm 提供模型调用。 */
export const inject = ['llm', 'connection']

/** 插件配置；不填 provider/model 时自动挑第一个可用组合。 */
export interface Config {
  /** 指定 provider 路由；必须与 model 一起给。 */
  readonly provider?: string
  /** 指定模型 id；必须与 provider 一起给。 */
  readonly model?: string
  /** 单次总结的输出上限。 */
  readonly maxOutputTokens?: number
  /** 单次总结的超时时间（毫秒）。 */
  readonly timeoutMs?: number
  /** 送入模型的最大字符数，超出时保留最近的对话。 */
  readonly maxInputChars?: number
}

const DEFAULTS = {
  maxOutputTokens: 800,
  timeoutMs: 90_000,
  maxInputChars: 16_000,
} as const

/** 系统提示：限定只输出三段要点，避免模型写成长篇。 */
const SYSTEM_PROMPT = [
  '你是会话记录助手。请阅读用户与 AI 助手的对话，提炼出关键信息。',
  '严格按下面三节输出 Markdown，不要输出其它内容：',
  '## 我的诉求',
  '## 关键结论',
  '## 待办与未决',
  '要求：',
  '1. 站在“用户”一侧：诉求、约束、决定、偏好、对方案的纠错都要记录；助手的话只作为结论背景。',
  '2. 每节用无序列表，1-5 条，每条不超过 40 个字，写成结论式的短句。',
  '3. 某一节确实没有内容时写“- 无”。',
  '4. 不要复述原话，不要寒暄，不要编造对话里没有的信息。',
].join('\n')

/** 模型路由。 */
interface Route {
  readonly provider: string
  readonly model: string
}

/** 宿主 ctx 的最小形状。 */
interface HostContext {
  effect: (callback: () => (() => void) | void, label?: string) => void
  llm: {
    listProviders: () => readonly { readonly id: string }[]
    listModels: (provider: string) => Promise<readonly { readonly id: string }[]>
    prepareCall: (
      config: { provider: string; model: string; maxTokens?: number },
      signal?: AbortSignal,
    ) => Promise<{
      config: Record<string, unknown>
      stream: (options: Record<string, unknown>) => AsyncIterable<StreamChunk>
    }>
  }
  connection: {
    fetch: {
      register: (route: {
        path: string
        methods: readonly string[]
        requestBody: 'buffered' | 'streaming'
        fetch: (request: Request) => Promise<Response>
      }) => () => Promise<void>
    }
  }
  logger?: {
    info: (message: string) => void
    warn: (message: string) => void
  }
}

/** llm.stream 产出的分片里本插件关心的部分。 */
type StreamChunk =
  | { readonly type: 'text-delta'; readonly text: string }
  | {
    readonly type: 'finish'
    readonly reason:
      | { readonly kind: 'stop' | 'tool-calls' | 'max-tokens' }
      | { readonly kind: 'error' | 'aborted'; readonly failure: { readonly code: string; readonly message: string } }
  }
  | { readonly type: string }

/** 构造 JSON 响应。 */
function json(status: number, body: SummarizeResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

/** 把任意异常压成一句能给用户看的话。 */
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/** 解析模型路由：显式配置优先，否则取第一个 provider 的第一个模型。 */
async function resolveRoute(ctx: HostContext, config: Config): Promise<Route> {
  if (config.provider !== undefined && config.model !== undefined) {
    return { provider: config.provider, model: config.model }
  }
  if (config.provider !== undefined || config.model !== undefined) {
    throw new Error('provider 与 model 必须同时配置')
  }
  const providers = ctx.llm.listProviders()
  if (providers.length === 0) throw new Error('宿主没有注册任何模型提供方')
  for (const provider of providers) {
    const models = await ctx.llm.listModels(provider.id)
    const first = models[0]
    if (first !== undefined) return { provider: provider.id, model: first.id }
  }
  throw new Error('没有可用的模型，请在插件配置里指定 provider 与 model')
}

/** 截断过长的会话记录，保留最近的部分。 */
function clipTranscript(transcript: string, limit: number): string {
  return transcript.length <= limit ? transcript : `（前文已省略）\n${transcript.slice(-limit)}`
}

/** 调一次模型并拼出完整文本。 */
async function complete(
  ctx: HostContext,
  config: Config,
  route: Route,
  transcript: string,
  signal: AbortSignal,
): Promise<string> {
  const maxTokens = config.maxOutputTokens ?? DEFAULTS.maxOutputTokens
  const call = await ctx.llm.prepareCall({ ...route, maxTokens }, signal)
  const messages = [{ role: 'user', content: [{ type: 'text', text: transcript }] }]
  let text = ''
  for await (const chunk of call.stream({
    ...call.config,
    system: SYSTEM_PROMPT,
    messages,
    signal,
  })) {
    if (chunk.type === 'text-delta') text += (chunk as { text: string }).text
    if (chunk.type === 'finish') {
      const reason = (chunk as Extract<StreamChunk, { type: 'finish' }>).reason
      if (reason.kind === 'error' || reason.kind === 'aborted') {
        throw new Error(`${reason.failure.code}: ${reason.failure.message}`)
      }
    }
  }
  return text.trim()
}

/** 处理一次总结请求。 */
async function handleSummarize(
  ctx: HostContext,
  config: Config,
  request: Request,
): Promise<Response> {
  let body: Partial<SummarizeRequest>
  try {
    body = await request.json() as Partial<SummarizeRequest>
  } catch {
    return json(400, { ok: false, error: '请求体不是合法 JSON' })
  }
  const raw = typeof body.transcript === 'string' ? body.transcript.trim() : ''
  if (raw === '') return json(400, { ok: false, error: '会话内容为空' })

  const transcript = clipTranscript(raw, config.maxInputChars ?? DEFAULTS.maxInputChars)
  const timeout = config.timeoutMs ?? DEFAULTS.timeoutMs
  const signal = AbortSignal.any([AbortSignal.timeout(timeout), request.signal])
  try {
    const route = await resolveRoute(ctx, config)
    const summary = await complete(ctx, config, route, transcript, signal)
    if (summary === '') return json(502, { ok: false, error: '模型没有返回内容' })
    return json(200, { ok: true, summary, provider: route.provider, model: route.model })
  } catch (error) {
    const message = describeError(error)
    ctx.logger?.warn(`[deepseek-harness-content] 总结失败：${message}`)
    return json(502, { ok: false, error: message })
  }
}

/** 注册路由；插件卸载时自动摘除。 */
export function apply(ctx: HostContext, config: Config = {}): void {
  ctx.effect(() => {
    const dispose = ctx.connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: request => handleSummarize(ctx, config, request),
    })
    return () => { void dispose() }
  }, 'deepseek-harness-content: summarize route')
  ctx.logger?.info('[deepseek-harness-content] 总结接口已挂载')
}
