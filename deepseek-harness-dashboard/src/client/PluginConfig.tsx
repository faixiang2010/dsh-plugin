/**
 * DSH 全局设置页面 —— 主题选择面板（浅色白底友好）。
 * 每个主题一张缩略图：小模型 Hero 标题 + KPI 条 + 卡片网格。
 * 点击缩略图 → 即时切换大屏主题。
 */
import type { LocaleKey } from './locales.js'
import { THEMES } from './themes.js'
import { useTheme } from './useTheme.js'

export function PluginConfig({ t }: { t: (key: LocaleKey) => string }) {
  const [theme, setTheme] = useTheme()

  return (
    <div className="dwd-theme-panel">
      <div className="dwd-theme-panel-head">
        <h2>{t('cfgTitle')}</h2>
        <p>{t('cfgDesc')}</p>
      </div>

      <div className="dwd-theme-panel-grid">
        {THEMES.map(tm => (
          <button
            key={tm.id}
            type="button"
            className={`dwd-theme-panel-item${theme === tm.id ? ' dwd-theme-panel-item--active' : ''}`}
            onClick={() => setTheme(tm.id)}
            aria-pressed={theme === tm.id}
          >
            <ThemeThumb themeId={tm.id} palette={tm.accentPalette} />
            <div className="dwd-theme-panel-meta">
              <span className="dwd-theme-panel-name">{tm.name}</span>
              <span className="dwd-theme-panel-desc">{tm.desc}</span>
            </div>
            {theme === tm.id && <span className="dwd-theme-panel-tick">✓</span>}
          </button>
        ))}
      </div>

      <div className="dwd-theme-panel-foot">{t('cfgHint')}</div>
    </div>
  )
}

/** 单个主题缩略图 —— 用 CSS 拼出小尺寸 dashboard 预览。 */
function ThemeThumb({ themeId, palette }: { themeId: string; palette: string[] }) {
  const [c0, c1, c2, c3] = palette
  const themeClass = `dwd-thumb-${themeId.replace(/[^a-z]/gi, '')}`

  return (
    <div className={`dwd-thumb ${themeClass}`}>
      {/* 顶部 Hero 条 */}
      <div className="dwd-thumb-hero">
        <div className="dwd-thumb-title" style={{ background: `linear-gradient(90deg, ${c0}, ${c1}, ${c2})` }}>武汉 · 九省通衢</div>
        <div className="dwd-thumb-meta">DATA//2024</div>
      </div>
      {/* KPI 小方块 */}
      <div className="dwd-thumb-kpi">
        {palette.map((c, i) => (
          <div key={i} className="dwd-thumb-kpi-cell" style={{ borderColor: c, boxShadow: `inset 0 0 6px ${c}33` }}>
            <div className="dwd-thumb-kpi-num" style={{ color: c }}>{['1374万', '8494', '2.29t', '3500+'][i]}</div>
          </div>
        ))}
      </div>
      {/* 卡片网格 */}
      <div className="dwd-thumb-grid">
        <div className="dwd-thumb-card" style={{ borderLeftColor: c0 }}>
          <div className="dwd-thumb-card-head" style={{ color: c0 }}>🌐 地理</div>
          <div className="dwd-thumb-card-lines"><span /><span /></div>
        </div>
        <div className="dwd-thumb-card" style={{ borderLeftColor: c1 }}>
          <div className="dwd-thumb-card-head" style={{ color: c1 }}>📜 历史</div>
          <div className="dwd-thumb-card-lines"><span /><span /></div>
        </div>
        <div className="dwd-thumb-card dwd-thumb-card--full" style={{ borderLeftColor: c2 }}>
          <div className="dwd-thumb-card-head" style={{ color: c2 }}>💼 经济 · 光谷</div>
          <div className="dwd-thumb-card-lines"><span /><span /><span style={{ width: '80%' }} /></div>
        </div>
      </div>
      {/* 装饰 */}
      <div className="dwd-thumb-scan" />
    </div>
  )
}
