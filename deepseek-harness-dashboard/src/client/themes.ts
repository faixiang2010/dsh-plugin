/** 主题数据 —— 3 套 CSS 变量 + accent 色 + KPI accent 分配。 */

export type ThemeId = 'cyber-blue' | 'midnight-gold' | 'aurora-green'

export interface ThemeMeta {
  id: ThemeId
  name: string
  desc: string
  preview: string
  // 每组颜色对应一个 KPI 卡 / Card 模块的 accent
  accentPalette: string[]
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'cyber-blue',
    name: 'Cyber Blue',
    desc: '赛博蓝 · 默认科幻大屏',
    preview: 'linear-gradient(135deg, #00f0ff 0%, #7c3aed 100%)',
    accentPalette: ['#00f0ff', '#7c3aed', '#f0ab00', '#00ff88'],
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    desc: '暗夜金 · 高端商务光谷之光',
    preview: 'linear-gradient(135deg, #f0ab00 0%, #ff6a00 100%)',
    accentPalette: ['#f0ab00', '#ff6a00', '#ffd86b', '#ff9f1c'],
  },
  {
    id: 'aurora-green',
    name: 'Aurora Green',
    desc: '极光绿 · 生态科技光谷硅谷',
    preview: 'linear-gradient(135deg, #00ff88 0%, #ff3d7f 100%)',
    accentPalette: ['#00ff88', '#ff3d7f', '#38bdf8', '#a78bfa'],
  },
]

export const DEFAULT_THEME: ThemeId = 'cyber-blue'

export const STORAGE_KEY = 'dsh-dashboard-wuhan.theme'
