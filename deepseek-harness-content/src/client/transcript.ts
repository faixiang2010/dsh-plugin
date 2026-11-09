/** 把会话事件窗口整理成可交给模型阅读的对话文本。 */

/** 事件窗口里与总结相关的最小形状。 */
export interface WindowEntry {
  readonly type: 'event' | 'transient'
  readonly event?: {
    readonly type: string
    readonly seq: number
    readonly surfaceOp?: unknown
    readonly data?: {
      readonly content?: readonly { readonly type?: string; readonly text?: string }[]
      readonly message?: { readonly content?: readonly { readonly type?: string; readonly text?: string }[] }
      readonly source?: { readonly kind?: string }
    }
  }
}

/** 一条参与总结的对话消息。 */
export interface ChatMessage {
  readonly role: 'user' | 'assistant'
  readonly text: string
}

/** 会话整理结果。 */
export interface Transcript {
  readonly messages: readonly ChatMessage[]
  /** 已完成轮次：最后一条是助手回复时，等于用户消息条数。 */
  readonly rounds: number
  /** 拼好的纯文本，仍可能很长，由调用方截断。 */
  readonly text: string
}

/** 只取文本块。 */
function textOf(blocks: readonly { readonly type?: string; readonly text?: string }[] | undefined): string {
  if (blocks === undefined) return ''
  return blocks
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
    .trim()
}

/** 是否是流式过程中的半成品助手消息。append 表示内容还没落定。 */
function isPartialAssistant(surfaceOp: unknown): boolean {
  if (surfaceOp === 'append') return true
  if (surfaceOp !== null && typeof surfaceOp === 'object' && 'op' in surfaceOp) {
    return (surfaceOp as { readonly op: string }).op === 'append'
  }
  return false
}

/** 收集对话消息；只保留我方发言与助手最终回复。 */
export function collectMessages(entries: readonly WindowEntry[]): readonly ChatMessage[] {
  const messages: ChatMessage[] = []
  for (const entry of entries) {
    if (entry.type !== 'event') continue
    const event = entry.event
    if (event === undefined) continue

    if (event.type === 'user/message') {
      // 压缩检查点等系统注入不算“我说的话”。
      if (event.data?.source?.kind !== 'user') continue
      const text = textOf(event.data.content)
      if (text !== '') messages.push({ role: 'user', text })
      continue
    }

    if (event.type === 'assistant/message') {
      if (isPartialAssistant(event.surfaceOp)) continue
      const text = textOf(event.data?.message?.content)
      if (text !== '') messages.push({ role: 'assistant', text })
    }
  }
  return messages
}

/** 把消息拼成对话文本，并给出完成的轮次。 */
export function buildTranscript(entries: readonly WindowEntry[]): Transcript {
  const messages = collectMessages(entries)
  const userCount = messages.filter(message => message.role === 'user').length
  const last = messages[messages.length - 1]
  const rounds = last?.role === 'assistant' ? userCount : Math.max(0, userCount - 1)
  const text = messages
    .map(message => `${message.role === 'user' ? '【我】' : '【助手】'}${message.text}`)
    .join('\n\n')
  return { messages, rounds, text }
}
