/** 大伟总结：在会话视图标签条上加一个「大伟总结」入口。 */
import { controllerFor, type BindingLike, type SummaryController } from './controller.ts'
import { DaweiSummaryView } from './DaweiSummaryView.tsx'
import { STYLES } from './styles.ts'

export const name = 'deepseek-harness-content'

/** 只依赖槽位服务与会话服务；两者都由 DSH 客户端内置提供。 */
export const inject = ['slots', 'sessions']

/** 拿不到会话绑定时的空数据源，保证标签仍然可渲染。 */
const EMPTY: SummaryController = {
  hooks: { summary: { getSnapshot: () => ({ entries: [], auto: false, running: false, rounds: 0 }), subscribe: () => () => {} } },
  summarize: () => {},
  clear: () => {},
  setAuto: () => {},
}

/** 客户端 ctx 的最小形状，避免把插件绑死在某一个 DSH 版本的内部类型上。 */
interface ClientContext {
  effect: (callback: () => (() => void) | void, label?: string) => void
  slots: {
    inject: (name: string, callback: () => (() => void) | void) => (() => void) | void
    register: (options: Record<string, unknown>, component: unknown) => () => void
  }
  sessions: { binding: (sessionId: string) => BindingLike | undefined }
}

/** 注入面板样式；重复加载时只保留一份。 */
function mountStyles(): () => void {
  const id = 'deepseek-harness-content:styles'
  const existing = document.getElementById(id)
  if (existing !== null) return () => { existing.remove() }
  const element = document.createElement('style')
  element.id = id
  element.textContent = STYLES
  document.head.appendChild(element)
  return () => { element.remove() }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(mountStyles, 'deepseek-harness-content: styles')

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'dawei-summary',
    order: 100,
    label: () => '大伟总结',
    inject: (sessionId: string) => {
      const binding = ctx.sessions.binding(sessionId)
      return binding === undefined ? EMPTY : controllerFor(binding, sessionId)
    },
  }, DaweiSummaryView))
}
