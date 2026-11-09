/** 浏览器插件入口：侧边栏图标 + main panel + 插件管理配置面板。 */
import type { Context } from '@deepseek-ai/cordis'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SidebarPanelIconOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { WuhanDashboard } from './WuhanDashboard.tsx'
import { PluginConfig } from './PluginConfig.tsx'
import { en, zh, type LocaleKey } from './locales.js'
import indexCss from './index.css?raw'

type ClientContext = Context

const NS = 'dwd'
export const PANEL_ID = 'dwd-wuhan' as MainPanelId
const ENTRY = 'dsh-dashboard-wuhan'

/** DSH 在 plugins.row.config slot 注入给我们的 props（与 dsh-client-ui-plugin-manager 的 PluginConfigViewProps 等价）。 */
interface PluginConfigViewProps {
  view: 'page' | 'summary'
  t: (key: string) => string
  form?: unknown
}

function DashboardIcon({ size }: SidebarPanelIconOwnerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12 L12 7" />
      <path d="M12 12 L16 14" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <path d="M12 4.5 V5.5" />
      <path d="M19.5 12 H18.5" />
      <path d="M12 19.5 V18.5" />
      <path d="M4.5 12 H5.5" />
    </svg>
  )
}

export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dwd: dictionaries')
  const t = (key: LocaleKey) => ctx.locale.bind(NS)(key)

  // 注入样式
  ctx.effect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-plugin', 'dsh-dashboard-wuhan')
    style.textContent = indexCss
    document.head.appendChild(style)
    return () => { style.remove() }
  }, 'dwd: inject styles')

  // 主面板
  ctx.slots.inject('main', () => ctx.slots.register(
    { name: 'main', key: PANEL_ID, locale: NS, inject: () => ({}) },
    () => <WuhanDashboard t={t} />,
  ))

  // 侧边栏菜单
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
    { name: 'sidebar.panellist', id: PANEL_ID, order: 50, label: () => t('panel'), locale: NS },
    DashboardIcon,
  ))

  // 插件管理设置页 —— DSH 在插件"设置"标签渲染。
  ctx.slots.inject('plugins.row.config', () => ctx.slots.register(
    { name: 'plugins.row.config', key: `${ENTRY}#${ENTRY}`, locale: NS },
    (props: PluginConfigViewProps) =>
      props.view === 'page' ? <PluginConfig t={t} /> : null,
  ))

  // DSH 全局设置对话框左侧菜单 + 右侧配置面板
  // 点击设置对话框左侧的"大伟的仪表盘"时，右侧渲染主题选择
  ctx.slots.inject('settings.section', () => ctx.slots.register(
    { name: 'settings.section', id: 'dwd-theme', order: 80, label: () => t('panel'), locale: NS },
    () => <PluginConfig t={t} />,
  ))
}
