// dwh-simple-loop / agent.js
// 一个“假”的 agent：不调用大模型，只在两种模式之间切换回复。
// 它唯一的目的是让 demo 在对话里一眼就能认出「这是我自己的 loop」。

import { agentEvents } from '@deepseek-ai/dsh-agent'
import { createAssistantMessage } from '@deepseek-ai/dsh-llm'
import { createScope } from '@deepseek-ai/dsh-scope'

export const MODES = {
  echo: {
    order: 1,
    key: 'echo',
    label: '复读模式',
    emoji: '🟢',
    verb: '原样复述',
    hint: '把你说的原样说回去',
  },
  reverse: {
    order: 2,
    key: 'reverse',
    label: '倒序模式',
    emoji: '🟣',
    verb: '倒过来',
    hint: '把你说的字符顺序倒过来',
  },
}

const ALIASES = new Map([
  ['1', 'echo'],
  ['echo', 'echo'],
  ['复读', 'echo'],
  ['复读模式', 'echo'],
  ['2', 'reverse'],
  ['reverse', 'reverse'],
  ['倒序', 'reverse'],
  ['倒序模式', 'reverse'],
])

export function normalizeMode(value) {
  if (typeof value !== 'string') return undefined
  return ALIASES.get(value.trim().toLowerCase())
}

/** 一条消息里所有文本块拼起来。 */
function messageText(message) {
  const blocks = Array.isArray(message?.content) ? message.content : []
  return blocks
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
}

const DIVIDER = '────────────────────'

export function modeBanner(mode) {
  const info = MODES[mode] ?? MODES.echo
  return `${info.emoji} dsh-simple-loop · 模式 ${info.order}/2 · ${info.label}`
}

function replyText(mode, text) {
  const info = MODES[mode] ?? MODES.echo
  const body =
    mode === 'reverse'
      ? `倒过来是：\n\n> ${Array.from(text).reverse().join('')}`
      : `你刚才说：\n\n> ${text.replace(/\n/g, '\n> ')}`
  return [
    modeBanner(mode),
    DIVIDER,
    body,
    '',
    '（这条回复由我自己的 loop 直接生成，没有经过大模型）',
    '切换模式：/mode 1（复读） · /mode 2（倒序）',
  ].join('\n')
}

function helpText(mode) {
  return [
    modeBanner(mode),
    DIVIDER,
    '可用命令：',
    '/mode      看看当前模式和用法',
    '/mode 1    切到复读模式',
    '/mode 2    切到倒序模式',
    '',
    '其他任何内容都会被当前模式处理。',
  ].join('\n')
}

/**
 * 处理 /mode 命令。
 * @returns {{ reply: string, mode?: string } | undefined} 不是命令时返回 undefined。
 */
export function handleCommand(text, currentMode, switchMode) {
  if (!text.startsWith('/mode')) return undefined
  const arg = text.slice('/mode'.length).trim()
  if (arg === '') return { reply: helpText(currentMode) }
  const next = normalizeMode(arg)
  if (next === undefined) {
    return {
      reply: [
        modeBanner(currentMode),
        DIVIDER,
        `不认识这个模式：${arg}`,
        '只支持 1（复读）或 2（倒序）。',
      ].join('\n'),
    }
  }
  switchMode(next)
  const info = MODES[next]
  return {
    reply: [`${info.emoji} dsh-simple-loop · 已切到模式 ${info.order}/2 · ${info.label}`, DIVIDER, info.hint].join(
      '\n',
    ),
    mode: next,
  }
}

/**
 * 极简 inbox：消息先进入等待队列，再由 loop 在回合边界取走。
 * 这里为了 demo 简单，只放在内存里（重启后清空）。
 */
export class SimpleInbox {
  constructor() {
    /** @type {any[]} 等待下一回合的消息 */
    this.turnMessages = []
    /** @type {any[]} 等待下一步的消息 */
    this.stepMessages = []
  }

  get nextTurn() {
    return this.turnMessages
  }

  get nextStep() {
    return this.stepMessages
  }

  get hasPending() {
    return this.turnMessages.length > 0 || this.stepMessages.length > 0
  }

  list(target) {
    return target === 'next-step' ? this.stepMessages : this.turnMessages
  }

  setList(target, messages) {
    if (target === 'next-step') this.stepMessages = messages
    else this.turnMessages = messages
  }

  append(target, message) {
    this.list(target).push(message)
  }

  prepend(target, message) {
    this.list(target).unshift(message)
  }

  replace(messageId, message) {
    for (const target of ['next-step', 'next-turn']) {
      const list = this.list(target)
      const index = list.findIndex((item) => item?.id === messageId)
      if (index >= 0) {
        this.setList(target, list.with(index, message))
        return true
      }
    }
    return false
  }

  remove(messageId) {
    for (const target of ['next-step', 'next-turn']) {
      const list = this.list(target)
      const index = list.findIndex((item) => item?.id === messageId)
      if (index >= 0) {
        this.setList(target, list.toSpliced(index, 1))
        return true
      }
    }
    return false
  }

  splice(target, start, deleteCount, inserted) {
    return this.list(target).splice(start, deleteCount, ...inserted)
  }

  clear() {
    this.setList('next-step', [])
    this.setList('next-turn', [])
  }

  /** loop 自己用：取走最多 limit 条消息。 */
  claim(target, limit = Number.POSITIVE_INFINITY) {
    return this.list(target).splice(0, limit)
  }
}

export class SimpleAgent {
  constructor(loopCtx, id, options, session, modeRef) {
    this.id = id
    this.options = options
    this.session = session
    this.modeRef = modeRef
    this.dispatch = agentEvents(loopCtx, this)
    this.scope = createScope(loopCtx, this)
    this.ctx = this.scope.ctx
    this.inbox = new SimpleInbox()
    this.turnCount = session.snapshotEvents().reduce((max, event) =>
      Math.max(max, Number.isSafeInteger(event.data?.turn) ? event.data.turn : 0), 0)
    this.phase = 'idle'
    this.cancelCause = undefined
    this.abort = undefined
    this.activity = undefined
  }

  get status() {
    return this.phase
  }

  get mode() {
    return this.modeRef.value
  }

  get modeInfo() {
    return MODES[this.mode] ?? MODES.echo
  }

  send(message, target = 'next-turn', wakeup = true) {
    if (target === 'next-turn') this.inbox.append('next-turn', message)
    else this.inbox.append('next-step', message)
    if (wakeup) this.wake()
  }

  followup(message) {
    this.send(message, 'next-turn', true)
  }

  steer(message) {
    this.send(message, 'next-step', true)
  }

  inject(message) {
    this.send(message, 'next-step', false)
  }

  cancel(cause, { keepInbox = false } = {}) {
    this.cancelCause = cause
    if (!keepInbox) this.inbox.clear()
    this.abort?.abort(cause)
  }

  whenIdle() {
    return this.activity ?? Promise.resolve()
  }

  async runMaintenance(task) {
    if (this.phase !== 'idle') throw new Error('agent is busy')
    this.setPhase('running')
    const done = Promise.resolve().then(task)
    this.activity = done.finally(() => this.setPhase('idle'))
    return this.activity
  }

  setPhase(phase) {
    this.phase = phase
    this.dispatch.emit('agent/status', { agent: this, status: phase })
  }

  /** 有新消息时启动回合。 */
  wake() {
    if (this.phase !== 'idle') return
    const abort = new AbortController()
    this.abort = abort
    this.setPhase('running')
    const done = this.runTurns(abort.signal).catch((error) => {
      this.ctx.logger?.warn?.(`[dwh-simple-loop] turn failed: ${error?.message ?? error}`)
    })
    this.activity = done.finally(() => {
      this.abort = undefined
      this.setPhase('idle')
    })
  }

  async runTurns(signal) {
    while (!signal.aborted && this.inbox.hasPending) {
      const turn = ++this.turnCount
      const admitted = [...this.inbox.claim('next-turn', 1), ...this.inbox.claim('next-step')]
      this.session.append('turn/start', { turn })
      let reason
      try {
        this.session.append('step/start', { turn, step: 1 })
        try {
          await this.runStep(turn, admitted, signal)
        } finally {
          this.session.append('step/end', { turn, step: 1 })
        }
        reason = { kind: 'completed' }
      } catch (error) {
        if (signal.aborted) {
          reason = { kind: 'aborted', reason: this.cancelCause ?? { kind: 'user' } }
        } else {
          reason = { kind: 'error', error: { message: String(error?.message ?? error), code: 'UNKNOWN' } }
          this.dispatch.emit('agent/error', { agent: this, error })
        }
      }
      this.session.append('turn/end', { turn, reason })
      this.cancelCause = undefined
    }
  }

  async runStep(turn, admitted, signal) {
    for (const message of admitted) {
      this.session.append('user/message', message, { surfaceOp: 'append' })
    }
    if (signal.aborted) return

    const text = admitted.map(messageText).join('\n\n').trim()
    const command = handleCommand(text, this.mode, (next) => {
      this.modeRef.value = next
    })
    const reply = command ? command.reply : replyText(this.mode, text === '' ? '（空消息）' : text)

    const message = createAssistantMessage({
      content: [{ type: 'text', text: reply }],
      source: { provider: 'dwh-simple-loop', model: `mode-${this.mode}` },
    })
    this.session.append(
      'assistant/message',
      { turn, step: 1, message, stream: [] },
      { surfaceOp: 'append' },
    )
  }
}
