/** 宿主端与浏览器端共用的接口约定。 */

/** 总结接口在宿主上的绝对路径（connection 精确路由以 /api 开头）。 */
export const ROUTE_PATH = '/api/dawei-summary/summarize'

/** 浏览器端使用的相对地址；相对路径在 Web 与桌面壳里都能落到当前 Host。 */
export const ROUTE_URL = 'api/dawei-summary/summarize'

/** 一次总结请求：客户端已把会话整理成纯文本。 */
export interface SummarizeRequest {
  /** 会话记录文本，user/assistant 交替，已按时间顺序拼好。 */
  readonly transcript: string
  /** 当前是第几轮对话，用于回填界面。 */
  readonly round: number
}

/** 一次总结响应。 */
export interface SummarizeResponse {
  readonly ok: boolean
  readonly summary?: string
  readonly provider?: string
  readonly model?: string
  readonly error?: string
}
