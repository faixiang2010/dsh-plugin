/**
 * Browser half of the Techno Neon skin for DeepSeek Harness.
 *
 * Two things happen here, both through published extension points, so the DSH
 * checkout stays untouched:
 *
 * 1. Token overlay — `ctx.theme.overrideTokens()` stacks the palette on top of
 *    whichever built-in theme the user has chosen. The theme presenter writes
 *    the composed tokens as inline CSS variables on `body`, which outranks the
 *    built-in token sheet without editing it. The appearance preference itself
 *    is never touched: a third-party theme id cannot be persisted by the host
 *    settings schema, and the settings scope's `adopt()` would overwrite it on
 *    the next boot, reconnect, or settings write.
 * 2. Enhancement sheet — one `<style>` tag scoped by `html[data-dsh-skin]`
 *    repaints the brand mark, the wordmark, the selection colour, and floating
 *    surface rim light. The attribute stays for the plugin's lifetime, so the
 *    enhancements survive light/dark switches together with the token layer.
 *
 * Artifact shape: the Client module loader fetches this file and calls the
 * factory with its module-table `require`. The wrapper below matches the
 * loader's contract exactly (see the DSH client bundle preset).
 */
window.__ModuleLoader__.load({
  id: 'dsh-skin-techno-neon',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    /** Plugin id; also the identity of the injected style tag and token layer. */
    const PLUGIN_ID = 'dsh-skin-techno-neon'
    /** Root attribute that scopes every enhancement rule to the skin. */
    const SKIN_ATTRIBUTE = 'data-dsh-skin'
    /** Attribute value used by the scoped selectors. */
    const SKIN_NAME = 'techno-neon'
    /**
     * Marker token written by the override layer. Reading it back from `body`
     * tells the self-heal check whether the layer is still live, since the host
     * drops a layer when the caller's effect scope is disposed.
     */
    const LAYER_MARK = '--dsh-skin-techno-neon-layer'

    /**
     * Dark palette: near-black navy surfaces, cyan brand accent, indigo rim.
     * Values stay deliberately low-chroma in the surfaces so the cyan reads as
     * light rather than decoration.
     */
    const DARK_TOKENS = {
      '--dsw-alias-bg-base': '#070b14',
      '--dsw-alias-bg-document-preview': '#0a111c',
      '--dsw-alias-bg-layer-1': '#0d1522',
      '--dsw-alias-bg-layer-2': '#121d2e',
      '--dsw-alias-bg-layer-3': '#18253a',
      '--dsw-alias-bg-overlay': '#101a29',
      '--dsw-alias-bg-module-platform': '#0f1927',
      '--dsw-alias-bg-multi-select': '#141f30',
      '--dsw-alias-bg-skeleton': 'rgba(56, 189, 248, 0.08)',
      '--dsw-alias-bg-mask-1': 'rgba(2, 6, 12, 0.55)',
      '--dsw-alias-bg-mask-2': 'rgba(2, 6, 12, 0.22)',
      '--dsw-alias-bg-mask-3': 'rgba(2, 6, 12, 0.55)',
      '--dsw-alias-bg-mask-drop': 'rgba(9, 18, 31, 0.72)',
      '--dsw-alias-border-inverted': 'rgba(255, 255, 255, 0.06)',
      '--dsw-alias-border-inverted2': 'rgba(255, 255, 255, 0.08)',
      '--dsw-alias-border-l1': 'rgba(56, 189, 248, 0.10)',
      '--dsw-alias-border-l2': 'rgba(56, 189, 248, 0.18)',
      '--dsw-alias-border-l3': 'rgba(56, 189, 248, 0.26)',
      '--dsw-alias-border-l4': 'rgba(56, 189, 248, 0.34)',
      '--dsw-alias-brand-primary': '#22d3ee',
      '--dsw-alias-brand-primary-invert': '#e2f6ff',
      '--dsw-alias-brand-text': '#e2f6ff',
      '--dsw-alias-button-contrast-fill': '#cfe1f5',
      '--dsw-alias-button-elevated-fill': '#16233a',
      '--dsw-alias-button-floating-fill': '#101a29',
      '--dsw-alias-button-floating-hover': '#16233a',
      '--dsw-alias-button-ghost-active-border': '#3b5773',
      '--dsw-alias-button-ghost-active-fill': '#16243a',
      '--dsw-alias-button-ghost-active-hover': '#1c2d45',
      '--dsw-alias-button-info-fill': '#38bdf8',
      '--dsw-alias-button-info-hover': '#7dd3fc',
      '--dsw-alias-button-primary-dimmed': '#123043',
      '--dsw-alias-button-primary-fill': '#22d3ee',
      '--dsw-alias-button-primary-hover': '#67e8f9',
      '--dsw-alias-interactive-bg-active': 'rgba(56, 189, 248, 0.14)',
      '--dsw-alias-interactive-bg-hover': 'rgba(56, 189, 248, 0.07)',
      '--dsw-alias-interactive-bg-hover-accent': 'rgba(34, 211, 238, 0.20)',
      '--dsw-alias-interactive-bg-hover-danger': 'rgba(244, 63, 94, 0.16)',
      '--dsw-alias-interactive-bg-hover-solid': '#16243a',
      '--dsw-alias-label-caption': '#55708c',
      '--dsw-alias-label-deep-diving': '#67e8f9',
      '--dsw-alias-label-deep-diving-shimmer': '#38bdf8',
      '--dsw-alias-label-dimmed': '#2a3b50',
      '--dsw-alias-label-primary': '#e6f2ff',
      '--dsw-alias-label-primary-bluish': '#cfe6ff',
      '--dsw-alias-label-primary-dimmed': '#cfe1f5',
      '--dsw-alias-label-primary-foreground': '#04121e',
      '--dsw-alias-label-primary-inverted': '#05101d',
      '--dsw-alias-label-secondary': '#93a9c4',
      '--dsw-alias-label-shimmer': 'rgba(125, 211, 252, 0.45)',
      '--dsw-alias-label-tertiary': '#6b829e',
      '--dsw-alias-link': '#38bdf8',
      '--dsw-alias-markdown-citation': '#12202f',
      '--dsw-alias-markdown-code-block': '#0a1320',
      '--dsw-alias-markdown-code-block-banner': '#0f1a2a',
      '--dsw-alias-markdown-code-segment-selected': '#16243a',
      '--dsw-alias-markdown-code-segment-unselected': '#0c1522',
      '--dsw-alias-markdown-inline-code': '#132033',
      '--dsw-alias-markdown-placeholder': '#0f1a29',
      '--dsw-alias-markdown-tag': '#132033',
      '--dsw-alias-menu-icon': '#a8c2dc',
      '--dsw-alias-menu-group-header-fill': 'rgba(10, 18, 29, 0.94)',
      '--dsw-alias-scrollbar-bg-l1': 'rgba(56, 189, 248, 0.22)',
      '--dsw-alias-scrollbar-bg-l2': 'rgba(56, 189, 248, 0.30)',
      '--dsw-alias-scrollbar-hover-l1': 'rgba(56, 189, 248, 0.45)',
      '--dsw-alias-scrollbar-hover-l2': 'rgba(56, 189, 248, 0.55)',
      '--dsw-alias-state-business-primary': '#22d3ee',
      '--dsw-alias-state-business-tertiary': '#0d2b38',
      '--dsw-alias-state-error-primary': '#fb7185',
      '--dsw-alias-state-error-secondary': '#f43f5e',
      '--dsw-alias-state-idle-primary': '#3f5570',
      '--dsw-alias-state-success-primary': '#34d399',
      '--dsw-alias-state-success-secondary': '#10b981',
      '--dsw-alias-state-success-tertiary': '#0b2e2a',
      '--dsw-alias-state-warn-label': '#fcd34d',
      '--dsw-alias-state-warn-primary': '#fbbf24',
      '--dsw-alias-state-warn-secondary': '#f59e0b',
      '--dsw-alias-state-warn-tertiary': '#3a2a10',
      '--dsw-alias-switch-thumb': '#22d3ee',
      '--dsw-alias-toast-bg': '#12233a',
      '--dsw-alias-toast-label': '#e6f2ff',
      '--dsw-alias-tooltip-bg': '#152740',
      '--dsw-alias-turn-trigger-bg': 'rgba(56, 189, 248, 0.07)',
      '--dsw-alias-turn-trigger-bg-hover': 'rgba(56, 189, 248, 0.14)',
      '--dsw-alias-code-diff-added': 'rgba(52, 211, 153, 0.14)',
      '--dsw-alias-code-diff-deleted': 'rgba(251, 113, 133, 0.14)',
      '--dsw-alias-file-diff-added-bg': '#0d2a28',
      '--dsw-alias-file-diff-added-gutter': '#08201f',
      '--dsw-alias-file-diff-added-marker': '#34d399',
      '--dsw-alias-file-diff-deleted-bg': '#2c1220',
      '--dsw-alias-file-diff-deleted-gutter': '#1e0c16',
      '--dsw-alias-file-diff-deleted-marker': '#fb7185',
      '--dsw-menu-surface-fill': 'rgba(13, 24, 38, 0.72)',
      '--dsw-specific-bubble': '#0f1c2d',
      '--dsw-specific-bubble-highlight': '#17324a',
      '--dsw-specific-input-major': '#0a1220',
      '--dsw-specific-login-input': '#0b1626',
      '--dsw-specific-menu': 'rgba(13, 24, 38, 0.72)',
      '--dsw-specific-selector': '#101d2e',
      '--dsw-specific-sidebar-fill': '#050a12',
      '--dsw-specific-sidebar-nav-item-active': '#152437',
      '--dsw-specific-sidebar-nav-item-active-accent': '#0f2f42',
      '--dsw-specific-sidebar-nav-item-hover': '#101b2b',
      '--dsw-specific-tip': '#0e1a29',
    }

    /**
     * Light palette: cool paper surfaces with a deeper teal accent, so the same
     * identity survives the scheme switch without the neon glow washing out.
     */
    const LIGHT_TOKENS = {
      '--dsw-alias-bg-base': '#f1f5fa',
      '--dsw-alias-bg-document-preview': '#ffffff',
      '--dsw-alias-bg-layer-1': '#ffffff',
      '--dsw-alias-bg-layer-2': '#f7fafd',
      '--dsw-alias-bg-layer-3': '#eaf1f9',
      '--dsw-alias-bg-overlay': '#ffffff',
      '--dsw-alias-bg-module-platform': '#eef4fa',
      '--dsw-alias-bg-multi-select': '#eaf1f9',
      '--dsw-alias-bg-skeleton': 'rgba(14, 116, 144, 0.07)',
      '--dsw-alias-border-l1': 'rgba(14, 116, 144, 0.06)',
      '--dsw-alias-border-l2': 'rgba(14, 116, 144, 0.12)',
      '--dsw-alias-border-l3': 'rgba(14, 116, 144, 0.18)',
      '--dsw-alias-border-l4': 'rgba(14, 116, 144, 0.24)',
      '--dsw-alias-brand-primary': '#0e7490',
      '--dsw-alias-brand-primary-invert': '#0b1b2b',
      '--dsw-alias-brand-text': '#0b1b2b',
      '--dsw-alias-button-contrast-fill': '#0b1b2b',
      '--dsw-alias-button-elevated-fill': '#ffffff',
      '--dsw-alias-button-floating-fill': '#ffffff',
      '--dsw-alias-button-floating-hover': '#eef4fa',
      '--dsw-alias-button-ghost-active-border': '#5e8ba6',
      '--dsw-alias-button-ghost-active-fill': '#e4eef7',
      '--dsw-alias-button-ghost-active-hover': '#dae7f3',
      '--dsw-alias-button-info-fill': '#0284c7',
      '--dsw-alias-button-info-hover': '#0ea5e9',
      '--dsw-alias-button-primary-dimmed': '#dbeaf3',
      '--dsw-alias-button-primary-fill': '#0e7490',
      '--dsw-alias-button-primary-hover': '#155e75',
      '--dsw-alias-interactive-bg-active': 'rgba(14, 116, 144, 0.12)',
      '--dsw-alias-interactive-bg-hover': 'rgba(14, 116, 144, 0.06)',
      '--dsw-alias-interactive-bg-hover-accent': 'rgba(14, 116, 144, 0.14)',
      '--dsw-alias-interactive-bg-hover-danger': 'rgba(225, 29, 72, 0.07)',
      '--dsw-alias-interactive-bg-hover-solid': '#eaf1f9',
      '--dsw-alias-label-caption': '#8298ad',
      '--dsw-alias-label-deep-diving': '#0e7490',
      '--dsw-alias-label-deep-diving-shimmer': '#0891b2',
      '--dsw-alias-label-dimmed': '#dbe6f1',
      '--dsw-alias-label-primary': '#0b1a2a',
      '--dsw-alias-label-primary-bluish': '#0b1a2a',
      '--dsw-alias-label-primary-dimmed': '#12263a',
      '--dsw-alias-label-primary-foreground': '#ffffff',
      '--dsw-alias-label-primary-inverted': '#ffffff',
      '--dsw-alias-label-secondary': '#47617c',
      '--dsw-alias-label-shimmer': 'rgba(11, 26, 42, 0.30)',
      '--dsw-alias-label-tertiary': '#6b8399',
      '--dsw-alias-link': '#0284c7',
      '--dsw-alias-markdown-citation': '#eaf1f9',
      '--dsw-alias-markdown-code-block': '#f4f8fc',
      '--dsw-alias-markdown-code-block-banner': '#e9f1f9',
      '--dsw-alias-markdown-code-segment-selected': '#ffffff',
      '--dsw-alias-markdown-code-segment-unselected': '#eef4fa',
      '--dsw-alias-markdown-inline-code': '#eef4fa',
      '--dsw-alias-markdown-placeholder': '#eef4fa',
      '--dsw-alias-markdown-tag': '#e9f1f9',
      '--dsw-alias-menu-icon': '#1c3850',
      '--dsw-alias-menu-group-header-fill': 'rgba(247, 250, 253, 0.94)',
      '--dsw-alias-scrollbar-bg-l1': 'rgba(14, 116, 144, 0.22)',
      '--dsw-alias-scrollbar-bg-l2': 'rgba(14, 116, 144, 0.26)',
      '--dsw-alias-scrollbar-hover-l1': 'rgba(14, 116, 144, 0.40)',
      '--dsw-alias-scrollbar-hover-l2': 'rgba(14, 116, 144, 0.46)',
      '--dsw-alias-state-business-primary': '#0e7490',
      '--dsw-alias-state-business-tertiary': '#dbeaf3',
      '--dsw-alias-state-error-primary': '#e11d48',
      '--dsw-alias-state-error-secondary': '#f43f5e',
      '--dsw-alias-state-idle-primary': '#b7c9d8',
      '--dsw-alias-state-success-primary': '#059669',
      '--dsw-alias-state-success-secondary': '#10b981',
      '--dsw-alias-state-success-tertiary': '#d7f2e5',
      '--dsw-alias-state-warn-label': '#b45309',
      '--dsw-alias-state-warn-primary': '#d97706',
      '--dsw-alias-state-warn-secondary': '#f59e0b',
      '--dsw-alias-state-warn-tertiary': '#fdf0d8',
      '--dsw-alias-switch-thumb': '#ffffff',
      '--dsw-alias-toast-bg': '#0f2a3d',
      '--dsw-alias-toast-label': '#f1f5fa',
      '--dsw-alias-tooltip-bg': '#12304a',
      '--dsw-alias-turn-trigger-bg': '#eef4fa',
      '--dsw-alias-turn-trigger-bg-hover': 'rgba(14, 116, 144, 0.06)',
      '--dsw-alias-code-diff-added': 'rgba(5, 150, 105, 0.08)',
      '--dsw-alias-code-diff-deleted': 'rgba(225, 29, 72, 0.08)',
      '--dsw-menu-surface-fill': 'rgba(247, 250, 253, 0.72)',
      '--dsw-specific-bubble': '#e6eff8',
      '--dsw-specific-bubble-highlight': '#d5e6f4',
      '--dsw-specific-input-major': '#ffffff',
      '--dsw-specific-login-input': '#f4f8fc',
      '--dsw-specific-menu': 'rgba(247, 250, 253, 0.72)',
      '--dsw-specific-selector': '#eaf1f9',
      '--dsw-specific-sidebar-fill': '#e6eef7',
      '--dsw-specific-sidebar-nav-item-active': '#dce9f5',
      '--dsw-specific-sidebar-nav-item-active-accent': '#cfe3f2',
      '--dsw-specific-sidebar-nav-item-hover': '#eaf1f9',
      '--dsw-specific-tip': '#eaf1f9',
    }

    /**
     * The replacement brand mark: a neon hexagon with a faceted core and four
     * circuit stubs. Rendered through the mark's background so the original
     * SVG geometry keeps providing the box size.
     */
    const BRAND_MARK_SVG = [
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>",
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>",
      "<stop offset='0' stop-color='#22d3ee'/><stop offset='1' stop-color='#6366f1'/>",
      '</linearGradient></defs>',
      "<path d='M32 4 58 18v28L32 60 6 46V18z' fill='none' stroke='url(#g)' stroke-width='3.5' stroke-linejoin='round'/>",
      "<path d='M32 17 45 24.5v15L32 47 19 39.5v-15z' fill='url(#g)' fill-opacity='0.18'/>",
      "<circle cx='32' cy='32' r='5.5' fill='#22d3ee'/>",
      "<path d='M32 9v7M32 48v7M9 32h7M48 32h7' stroke='url(#g)' stroke-width='3.5' stroke-linecap='round'/>",
      '</svg>',
    ].join('')

    /** Data URL for the mark; `encodeURIComponent` keeps `#` out of the URL fragment. */
    const BRAND_MARK_URL = 'url("data:image/svg+xml,' + encodeURIComponent(BRAND_MARK_SVG) + '")'

    /**
     * Enhancement sheet. Every rule is scoped by the root skin attribute, so a
     * user who picks a built-in theme gets the stock rendering back.
     *
     * Selector strategy — CSS Modules hash `local` class names to
     * `[hash]_[local]`; we use substring matches (`[class*="brandName"]`) to
     * stay immune to upstream hash churn. Geometry constants (FishLogo's
     * viewBox, wordmark's viewBox) let us target SVGs without class names at
     * all, which also reaches the collapsed-rail mark (same FishLogo component,
     * different slot, zero class overlap).
     */
    const ENHANCEMENT_CSS = [
      '/* ========== Selection ========== */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] ::selection {',
      '  background: rgba(34, 211, 238, 0.30);',
      '  color: inherit;',
      '}',
      '',
      '/* ========== FishLogo → neon hexagon ========== */',
      '/* FishLogo renders as <svg viewBox="0 0 23.16 17.04"><path/></svg>.',
      '   The viewBox is exported as a constant, so this selector survives class',
      '   name churn and also hits the collapsed-rail brand mark slot. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] svg[viewBox="0 0 23.16 17.04"] {',
      '  background: ' + BRAND_MARK_URL + ' center / contain no-repeat;',
      '  filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.55));',
      '  /* Preserve the original viewBox box sizing so the new mark fits. */',
      '  aspect-ratio: 23.16 / 17.04;',
      '}',
      '/* Hide the original path so only the background data URI shows. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] svg[viewBox="0 0 23.16 17.04"] > path {',
      '  display: none;',
      '}',
      '',
      '/* ========== BrandWordmark → gradient text ========== */',
      '/* OfficialBrandName renders <BrandWordmark includeMark={false} />,',
      '   whose viewBox is "26 0 156 24". There is also an includeMark=true variant',
      '   with viewBox "0 0 182 24". We hide both, plus any SVG descendant of the',
      '   brand-name container, since BrandWordmark wraps everything in one <svg>',
      '   whose <path fill="currentColor"> does NOT inherit CSS background-clip.',
      '   We repaint with a ::before pseudo-element on the container instead. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="brandName"] svg {',
      '  display: none;',
      '}',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="brandName"] {',
      '  min-width: 0;',
      '  height: 24px;',
      '  display: inline-flex;',
      '  align-items: center;',
      '}',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="brandName"]::before {',
      '  content: "大伟的智能体";',
      '  font-family: var(--ds-font-family-ui, "SF Pro Display", system-ui, -apple-system, sans-serif);',
      '  font-size: 14px;',
      '  font-weight: 700;',
      '  line-height: 24px;',
      '  letter-spacing: 0.06em;',
      '  white-space: nowrap;',
      '  background: linear-gradient(115deg, #22d3ee 0%, #818cf8 55%, #22d3ee 100%);',
      '  -webkit-background-clip: text;',
      '  background-clip: text;',
      '  color: transparent;',
      '}',
      '',
      '/* ========== Floating surface rim light ========== */',
      '/* `data-menu-material` is the shell-owned marker for menu backdrops and',
      '   popovers. Give them a cool cyan rim instead of a neutral drop. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [data-menu-material] {',
      '  box-shadow:',
      '    0 0 0 0.5px rgba(56, 189, 248, 0.24),',
      '    0 18px 48px rgba(2, 8, 18, 0.62),',
      '    0 0 24px rgba(34, 211, 238, 0.10);',
      '}',
      '',
      '/* ========== Sidebar brandMark subtle glow ========== */',
      '/* The brand-mark slot (wide sidebar) and the rail-mark slot (collapsed)',
      '   both end up inside an inline-flex wrapper — add a faint cyan halo to',
      '   make the swapped neon mark pop from the sidebar surface. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="brandMark"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="railMark"] {',
      '  filter: drop-shadow(0 0 4px rgba(34, 211, 238, 0.35));',
      '}',
      '',
      '/* ========== De-branding: hide upstream identity marks ========== */',
      '/* Preview / beta tag (Electron window title bar, hero, or header).',
      '   Text content is localized so we scope to size tokens and common class',
      '   substrings rather than matching the literal label. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="previewTag"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="preview-tag"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="PreviewTag"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="buildVersion"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="build-version"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="localBuild"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="local-build"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="beta"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="badge"] {',
      '  display: none !important;',
      '}',
      '',
      '/* Catch-all: hide any inline element whose visible text is exactly',
      '   "预览版", "Preview", "Preview Version", "Beta", or "本地构建".',
      '   :has(text) is not universally supported in 2026, so we target the',
      '   common containers and use a data-attribute fallback below. */',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="header"] [class*="tag"],',
      'html[' + SKIN_ATTRIBUTE + '="' + SKIN_NAME + '"] [class*="Header"] [class*="Tag"] {',
      '  display: none !important;',
      '}',
    ].join('\n')

    /** Every token name covered by either palette. */
    const TOKEN_NAMES = [...new Set([...Object.keys(DARK_TOKENS), ...Object.keys(LIGHT_TOKENS)])]

    /**
     * Build the override layer for one color scheme.
     *
     * Tokens defined by both palettes carry a real `{ light, dark }` pair, so a
     * scheme switch repaints correctly even before the layer is rebuilt. The
     * handful of tokens that exist only in the active palette (the dark masks,
     * inverted borders, and file-diff surfaces) repeat that palette's value;
     * the layer is rebuilt on every scheme change, so the other scheme never
     * keeps them.
     * @param {'light'|'dark'} mode - resolved color scheme.
     */
    function buildOverrideTokens(mode) {
      const tokens = {}
      for (const name of TOKEN_NAMES) {
        const dark = DARK_TOKENS[name]
        const light = LIGHT_TOKENS[name]
        if (dark !== undefined && light !== undefined) {
          tokens[name] = { light, dark }
        } else if (mode === 'dark' && dark !== undefined) {
          tokens[name] = { light: dark, dark }
        } else if (mode === 'light' && light !== undefined) {
          tokens[name] = { light, dark: light }
        }
      }
      tokens[LAYER_MARK] = { light: '1', dark: '1' }
      return tokens
    }

    /** Resolve the snapshot's active color scheme. */
    function resolveMode(snapshot) {
      return snapshot.active.colorScheme === 'dark' ? 'dark' : 'light'
    }

    /**
     * Mount the enhancement sheet for exactly the owning plugin lifetime.
     * @param {object} ctx - Client Cordis context.
     */
    function installEnhancementStyles(ctx) {
      if (typeof document === 'undefined') return
      ctx.effect(() => {
        const tag = document.createElement('style')
        tag.dataset.plugin = PLUGIN_ID
        tag.dataset.pluginCss = PLUGIN_ID + '/techno-neon.css'
        tag.textContent = ENHANCEMENT_CSS
        document.head.appendChild(tag)
        return () => { tag.remove() }
      }, 'skin-techno-neon: enhancement sheet')
    }

    /**
     * Publish the root skin attribute for the plugin's lifetime. The token layer
     * decides the colors and follows light/dark on its own, so the attribute no
     * longer tracks the active theme id.
     * @param {object} ctx - Client Cordis context.
     */
    function installSkinAttribute(ctx) {
      if (typeof document === 'undefined') return
      ctx.effect(() => {
        document.documentElement.setAttribute(SKIN_ATTRIBUTE, SKIN_NAME)
        return () => { document.documentElement.removeAttribute(SKIN_ATTRIBUTE) }
      }, 'skin-techno-neon: root marker')
    }

    /**
     * Mount the palette as a token override layer.
     *
     * Why not `register()` + `setTheme()`: the host persists only the built-in
     * `light | dark | system` preference. A third-party theme id lives in the
     * runtime only, and every `adopt()` of the settings scope (boot read,
     * reconnect, any settings write) replaces it with the durable value — the
     * skin visibly snaps back after a while and never survives a restart.
     * `overrideTokens()` composes with the built-in theme instead, leaves the
     * preference untouched, and is restored by this plugin's own mount.
     * @param {object} ctx - Client Cordis context.
     */
    function installTokenLayer(ctx) {
      if (typeof ctx.theme.overrideTokens !== 'function') {
        console.warn('[dsh-skin-techno-neon] 当前 ui-theme 不支持 overrideTokens，皮肤配色未应用')
        return
      }

      let appliedMode = null
      let disposeLayer = null
      let applying = false
      let lastAppliedAt = 0
      let applyFailed = false

      /** Whether the marker token is still present on the rendered body. */
      const layerAlive = () => {
        if (typeof document === 'undefined' || document.body === null) return true
        if (typeof getComputedStyle !== 'function') return true
        return getComputedStyle(document.body).getPropertyValue(LAYER_MARK).trim() === '1'
      }

      const apply = (mode) => {
        if (applying) return
        applying = true
        try {
          const previous = disposeLayer
          disposeLayer = ctx.theme.overrideTokens(PLUGIN_ID, buildOverrideTokens(mode))
          appliedMode = mode
          applyFailed = false
          // Same source replaces the whole layer; the old disposer is already a
          // no-op, but calling it keeps the ownership chain explicit.
          if (previous !== null && previous !== disposeLayer) previous()
        } catch (err) {
          if (!applyFailed) {
            applyFailed = true
            console.error('[dsh-skin-techno-neon] 皮肤色板应用失败：', err)
          }
        } finally {
          applying = false
          lastAppliedAt = Date.now()
        }
      }

      /**
       * Keep the layer correct: rebuild it when the resolved scheme changes,
       * and replay it when the host dropped it (a layer is owned by the effect
       * scope that created it). The `applying` guard matters because
       * `overrideTokens()` emits `theme/change` synchronously, before the
       * presenter has written the new variables.
       * @param {object} [snapshot] - event payload, when available.
       */
      const ensure = (snapshot) => {
        if (applying) return
        const mode = resolveMode(snapshot ?? ctx.theme.getTheme())
        if (mode !== appliedMode) {
          apply(mode)
          return
        }
        // Give the presenter a beat to write the marker before probing.
        if (Date.now() - lastAppliedAt < 1000) return
        if (layerAlive()) return
        apply(mode)
      }

      ctx.effect(() => {
        apply(resolveMode(ctx.theme.getTheme()))
        const off = ctx.on('theme/change', ensure)
        const onVisible = () => {
          if (document.visibilityState !== 'hidden') ensure()
        }
        const onFocus = () => ensure()
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onFocus)
        const timer = setInterval(() => {
          if (document.visibilityState === 'hidden') return
          ensure()
        }, 15000)
        return () => {
          off()
          document.removeEventListener('visibilitychange', onVisible)
          window.removeEventListener('focus', onFocus)
          clearInterval(timer)
          if (disposeLayer !== null) disposeLayer()
          disposeLayer = null
          appliedMode = null
        }
      }, 'skin-techno-neon: token layer')
    }

    /**
     * Hide the upstream preview / beta / local-build badge by walking the DOM
     * once and also subscribing to later mutations. We do not know the DSH
     * component class names ahead of time, so we match the localized label
     * text directly. The listener retracts when the plugin disables.
     *
     * @param {object} ctx - Client Cordis context.
     */
    function installPreviewBadgeHider(ctx) {
      if (typeof document === 'undefined') return
      const LABELS = new Set([
        '预览版',
        'Preview',
        'preview',
        'Preview Version',
        'Beta',
        'beta',
        '本地构建',
        'Local Build',
      ])

      const hide = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim()
          if (text && LABELS.has(text)) {
            let el = node.parentElement
            while (el && el !== document.body) {
              const tag = el.tagName
              if (tag === 'SPAN' || tag === 'DIV' || tag === 'BUTTON' || tag === 'EM' || tag === 'STRONG') {
                el.style.setProperty('display', 'none', 'important')
                return
              }
              el = el.parentElement
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          node.childNodes.forEach(hide)
        }
      }

      const scan = () => { document.body?.childNodes.forEach(hide) }

      ctx.effect(() => {
        const body = document.body
        if (body === null) return
        scan()
        const mo = new MutationObserver((records) => {
          for (const record of records) {
            record.addedNodes.forEach(scan)
          }
        })
        mo.observe(body, { childList: true, subtree: true })
        return () => { mo.disconnect() }
      }, 'skin-techno-neon: preview badge hider')
    }

    /** Required service: the theme registry that owns the token layers. */
    exports.inject = ['theme']

    /** Plugin name for loader diagnostics. */
    exports.name = PLUGIN_ID

    /**
     * Client plugin body.
     * @param {object} ctx - Client Cordis context with `theme` injected.
     */
    exports.apply = function apply(ctx) {
      installEnhancementStyles(ctx)
      installTokenLayer(ctx)
      installSkinAttribute(ctx)
      installPreviewBadgeHider(ctx)
    }

    return module.exports
  },
})
