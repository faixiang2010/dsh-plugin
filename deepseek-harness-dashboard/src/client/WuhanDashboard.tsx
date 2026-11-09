/**
 * 武汉城市科技大屏面板 —— 三套主题自适应。
 * 主题配置通过右上角 gear 按钮弹出抽屉，替代有问题的 plugins.row.config slot。
 */
import { useMemo, useState } from 'react'
import type { LocaleKey } from './locales.js'
import { useTheme } from './useTheme.js'
import { THEMES, type ThemeId } from './themes.js'

export function WuhanDashboard({ t }: { t: (key: LocaleKey) => string }) {
  const [theme, setTheme] = useTheme()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const palette = useMemo(() =>
    THEMES.find(tm => tm.id === theme)?.accentPalette ?? THEMES[0]!.accentPalette,
    [theme],
  )

  const [c0, c1, c2, c3] = palette

  return (
    <div className="dwd-root">
      {/* 背景装饰 */}
      <div className="dwd-bg">
        <div className="dwd-bg-grid" />
        <div className="dwd-bg-scan" />
        <div className="dwd-bg-glow dwd-bg-glow--a" />
        <div className="dwd-bg-glow dwd-bg-glow--b" />
      </div>

      {/* Hero 头部 */}
      <header className="dwd-hero">
        <div className="dwd-hero-corner dwd-hero-corner--tl" />
        <div className="dwd-hero-corner dwd-hero-corner--tr" />
        <div className="dwd-hero-corner dwd-hero-corner--bl" />
        <div className="dwd-hero-corner dwd-hero-corner--br" />

        <div className="dwd-hero-top">
          <div className="dwd-hero-badge">
            <span className="dwd-dot-pulse" />
            <span className="dwd-badge-text">LIVE · WUHAN · 武汉</span>
          </div>
          <div className="dwd-hero-right">
            <div className="dwd-hero-meta">
              <span className="dwd-meta-item">DATA // 2024</span>
              <span className="dwd-meta-item">SYS // ONLINE</span>
            </div>
            <button
              className="dwd-gear-btn"
              type="button"
              onClick={() => setDrawerOpen(v => !v)}
              aria-label="Theme settings"
              title={t('cfgTitle')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        <h1 className="dwd-title">
          <span className="dwd-title-glitch">{t('wuhanIntro')}</span>
        </h1>
        <p className="dwd-subtitle">{t('subtitle')}</p>

        <div className="dwd-hero-divider">
          <span className="dwd-divider-bar" />
          <span className="dwd-divider-diamond">◆</span>
          <span className="dwd-divider-bar" />
        </div>
      </header>

      {/* KPI 大数字行 */}
      <section className="dwd-kpi-row">
        <KpiCard label={t('population')} value={t('populationValue')} accent={c0} />
        <KpiCard label={t('area')} value={t('areaValue')} accent={c1} />
        <KpiCard label="GDP" value={t('gdpValue')} accent={c2} />
        <KpiCard label={t('founded')} value={t('foundedValue')} accent={c3} />
      </section>

      {/* 主网格 */}
      <div className="dwd-grid">
        <Card title={t('geography')} accent={c0} icon="🌐">
          <dl className="dwd-kv">
            <div><dt>{t('location')}</dt><dd>{t('locationValue')}</dd></div>
            <div><dt>{t('climate')}</dt><dd>{t('climateValue')}</dd></div>
            <div className="dwd-kv-full"><dt>{t('water')}</dt><dd>{t('waterValue')}</dd></div>
          </dl>
        </Card>

        <Card title={t('history')} accent={c2} icon="📜">
          <p className="dwd-prose">{t('historyContent')}</p>
        </Card>

        <Card title={t('basicInfo')} accent={c1} icon="📋">
          <dl className="dwd-kv">
            <div><dt>{t('province')}</dt><dd>{t('provinceValue')}</dd></div>
            <div><dt>{t('nickname')}</dt><dd>{t('nicknameValue')}</dd></div>
          </dl>
        </Card>

        <Card title={t('economy')} accent={c3} icon="💼" highlight>
          <dl className="dwd-kv">
            <div className="dwd-kv-full">
              <dt>{t('tech')}</dt>
              <dd className="dwd-optics-val">{t('techValue')}</dd>
            </div>
            <div className="dwd-kv-full"><dt>{t('industries')}</dt><dd>{t('industriesValue')}</dd></div>
          </dl>
        </Card>

        <Card title={t('culture')} accent={palette[3] ?? c0} icon="🎭" full>
          <div className="dwd-three-col">
            <div className="dwd-col">
              <div className="dwd-col-tag">FOOD</div>
              <h3>{t('famousFoods')}</h3>
              <p>{t('famousFoodsValue')}</p>
            </div>
            <div className="dwd-col">
              <div className="dwd-col-tag">SCENIC</div>
              <h3>{t('famousAttractions')}</h3>
              <p>{t('famousAttractionsValue')}</p>
            </div>
            <div className="dwd-col">
              <div className="dwd-col-tag">EDU</div>
              <h3>{t('famousUniversities')}</h3>
              <p>{t('famousUniversitiesValue')}</p>
            </div>
          </div>
        </Card>

        <Card title={t('traffic')} accent={palette[0] ?? c0} icon="🚄" full>
          <p className="dwd-prose">{t('trafficContent')}</p>
        </Card>
      </div>

      {/* Footer */}
      <footer className="dwd-footer">
        <span>{t('footer')}</span>
        <span className="dwd-footer-sep">|</span>
        <span>SYS: ALL NOMINAL</span>
        <span className="dwd-footer-sep">|</span>
        <span>BUILD: DWD-v0.2</span>
      </footer>

      {/* 主题配置抽屉 */}
      {drawerOpen && (
        <ThemeDrawer
          theme={theme}
          onSelect={(id) => { setTheme(id); setDrawerOpen(false) }}
          onClose={() => setDrawerOpen(false)}
          t={t}
        />
      )}
      {drawerOpen && <div className="dwd-backdrop" onClick={() => setDrawerOpen(false)} />}
    </div>
  )
}

/** 右侧滑出的主题选择抽屉 */
function ThemeDrawer({ theme, onSelect, onClose, t }: {
  theme: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
  t: (key: LocaleKey) => string;
}) {
  return (
    <aside className="dwd-drawer" role="dialog" aria-label={t('cfgTitle')}>
      <div className="dwd-drawer-head">
        <div>
          <div className="dwd-drawer-title">{t('cfgTitle')}</div>
          <div className="dwd-drawer-sub">{t('cfgDesc')}</div>
        </div>
        <button className="dwd-drawer-close" type="button" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <div className="dwd-drawer-body">
        {THEMES.map(tm => (
          <button
            key={tm.id}
            type="button"
            className={`dwd-drawer-card${theme === tm.id ? ' dwd-drawer-card--active' : ''}`}
            onClick={() => onSelect(tm.id)}
          >
            <div className="dwd-drawer-preview" style={{ background: tm.preview }}>
              {theme === tm.id && <span className="dwd-drawer-check">✓</span>}
            </div>
            <div className="dwd-drawer-info">
              <span className="dwd-drawer-name">{tm.name}</span>
              <span className="dwd-drawer-desc">{tm.desc}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="dwd-drawer-foot">{t('cfgHint')}</div>
    </aside>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="dwd-kpi" style={{ '--dwd-accent': accent } as React.CSSProperties}>
      <div className="dwd-kpi-scan" />
      <div className="dwd-kpi-corner dwd-kpi-corner--tl" />
      <div className="dwd-kpi-corner dwd-kpi-corner--tr" />
      <div className="dwd-kpi-corner dwd-kpi-corner--bl" />
      <div className="dwd-kpi-corner dwd-kpi-corner--br" />
      <div className="dwd-kpi-label">{label}</div>
      <div className="dwd-kpi-value">{value}</div>
      <div className="dwd-kpi-bar"><span /></div>
    </div>
  )
}

function Card({ title, accent, icon, children, full, highlight }: {
  title: string; accent: string; icon: string; children: React.ReactNode; full?: boolean; highlight?: boolean
}) {
  return (
    <section
      className={`dwd-card${full ? ' dwd-card--full' : ''}${highlight ? ' dwd-card--highlight' : ''}`}
      style={{ '--dwd-accent': accent } as React.CSSProperties}
    >
      <div className="dwd-card-corner dwd-card-corner--tl" />
      <div className="dwd-card-corner dwd-card-corner--tr" />
      <div className="dwd-card-corner dwd-card-corner--bl" />
      <div className="dwd-card-corner dwd-card-corner--br" />
      <div className="dwd-card-head">
        <span className="dwd-card-icon">{icon}</span>
        <h2>{title}</h2>
        <span className="dwd-card-tag">MODULE</span>
      </div>
      <div className="dwd-card-body">{children}</div>
    </section>
  )
}
