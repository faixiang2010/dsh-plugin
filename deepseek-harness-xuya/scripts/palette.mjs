/** Map the reference palette onto the DSH token roles, preserving semantic colors. */
export function paletteTokens(brand) {
  const roles = {
    '--dsw-alias-bg-base': 'canvas', '--dsw-alias-bg-layer-1': 'surface', '--dsw-alias-bg-layer-2': 'surface',
    '--dsw-alias-bg-layer-3': 'soft', '--dsw-alias-bg-overlay': 'surface',
    '--dsw-specific-sidebar-fill': 'shell', '--dsw-specific-input-major': 'surface', '--dsw-specific-login-input': 'soft',
    '--dsw-alias-label-primary': 'ink', '--dsw-alias-label-primary-dimmed': 'ink',
    '--dsw-alias-label-primary-bluish': 'ink', '--dsw-alias-label-secondary': 'secondary', '--dsw-alias-label-tertiary': 'muted',
    '--dsw-alias-label-caption': 'muted', '--dsw-alias-menu-icon': 'secondary',
    '--dsw-alias-border-l1': 'line', '--dsw-alias-border-l2': 'line', '--dsw-alias-border-l3': 'lineStrong', '--dsw-alias-border-l4': 'lineStrong',
    '--dsw-alias-brand-primary': 'brand', '--dsw-alias-brand-primary-invert': 'onBrand', '--dsw-alias-brand-text': 'brandInk',
    '--dsw-alias-brand-primary-new-colorprimary-new-color': 'brand',
    '--dsw-alias-button-info-fill': 'infoFill', '--dsw-alias-button-info-hover': 'infoHover',
    '--dsw-specific-sidebar-nav-item-active-accent': 'brandSoft',
    '--dsw-alias-button-primary-fill': 'brand', '--dsw-alias-button-primary-hover': 'brandHover',
    '--dsw-alias-button-elevated-fill': 'surface', '--dsw-alias-button-floating-fill': 'surface',
    '--dsw-alias-label-primary-foreground': 'onBrand', '--dsw-alias-label-primary-inverted': 'onBrand',
    '--dsw-alias-interactive-bg-active': 'brandSoft', '--dsw-alias-interactive-bg-hover': 'soft',
    '--dsw-alias-interactive-bg-hover-solid': 'soft', '--dsw-alias-interactive-bg-hover-accent': 'brandSoft',
    '--dsw-alias-markdown-code-block': 'soft', '--dsw-alias-markdown-code-block-banner': 'shell', '--dsw-alias-markdown-inline-code': 'soft',
    '--dsw-alias-link': 'brandInk', '--xuya-brand-ink': 'brandInk', '--xuya-brand-soft': 'brandSoft',
  }
  const tokens = Object.fromEntries(Object.entries(roles).map(([token, role]) => [token, { light: brand.light[role], dark: brand.dark[role] }]))
  for (const [name, value] of Object.entries({
    '--dsw-radius-xs': '6px', '--dsw-radius-sm': '10px', '--dsw-radius-md': '14px', '--dsw-radius-lg': '20px', '--dsw-radius-xl': '24px', '--dsw-radius-panel': '28px',
    '--dsh-font-family-text-default': "'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif",
    '--ds-transition-duration-fast': '140ms', '--ds-transition-duration': '220ms',
  })) tokens[name] = { light: value, dark: value }
  return tokens
}

/** Emit the same values for the Host's pre-plugin interval. */
export function bootCss(tokens) {
  const mode = key => Object.entries(tokens).map(([name, value]) => `${name}:${value[key]}`).join(';')
  return `html body{${mode('light')};background-color:var(--dsw-alias-bg-base);--dsh-boot-bg:var(--dsw-alias-bg-base)}html body[data-ds-dark-theme]{${mode('dark')}}`
}
