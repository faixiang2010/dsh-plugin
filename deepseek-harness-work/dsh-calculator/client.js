window.__ModuleLoader__.load({
  id: '@local/dsh-calculator',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'calculator'
    const MAX_LEN = 16

    // ------------------------------------------------------------------ text
    const EN = {
      'meta.title': 'Calculator',
      'meta.description': 'Floating calculator with keyboard support, opened from the sidebar footer.',
      'title': 'Calculator',
      'action.open': 'Open calculator',
      'action.close': 'Close calculator',
      'button.close': 'Close',
      'hint.keyboard': 'Keyboard: 0-9 . + - * / % Enter Backspace, Delete or C clears, Esc closes',
      'error.divideByZero': 'Cannot divide by zero',
    }

    const ZH = {
      'meta.title': '计算器',
      'meta.description': '浮在界面上的计算器，支持键盘输入，从侧边栏底部打开。',
      'title': '计算器',
      'action.open': '打开计算器',
      'action.close': '关闭计算器',
      'button.close': '关闭',
      'hint.keyboard': '键盘：0-9 . + - * / % Enter 回车，Backspace 退格，Delete 或 C 清空，Esc 关闭',
      'error.divideByZero': '不能除以零',
    }

    let dict = EN
    let bound = null

    function translate(key) {
      if (typeof bound === 'function') {
        try {
          const value = bound(key)
          if (typeof value === 'string' && value && value !== key) return value
        } catch (_) {
          /* a broken locale binding must never hide the UI */
        }
      }
      const fallback = dict[key]
      return typeof fallback === 'string' ? fallback : key
    }

    // ----------------------------------------------------------- calculator
    const OP_GLYPH = { add: '+', sub: '\u2212', mul: '\u00d7', div: '\u00f7' }

    function makeState() {
      return { entry: '0', acc: null, op: null, fresh: true, error: null, expr: '', solved: false }
    }

    function parseEntry(text) {
      const value = Number(text)
      return Number.isFinite(value) ? value : 0
    }

    function format(value) {
      if (!Number.isFinite(value)) return null
      const abs = Math.abs(value)
      if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) return value.toExponential(6)
      return String(Number(value.toPrecision(12)))
    }

    function compute(left, right, op) {
      if (op === 'add') return left + right
      if (op === 'sub') return left - right
      if (op === 'mul') return left * right
      if (op === 'div') return right === 0 ? null : left / right
      return right
    }

    function reduce(state, action) {
      if (action.type === 'clear') return makeState()

      let st = state
      if (st.error) {
        if (action.type === 'back') return makeState()
        st = makeState()
      }

      switch (action.type) {
        case 'digit': {
          if (st.solved) st = makeState()
          if (st.fresh) st = { ...st, entry: '0', fresh: false }
          const digit = String(action.value)
          const current = st.entry
          if (current === '0') st = { ...st, entry: digit }
          else if (current === '-0') st = { ...st, entry: '-' + digit }
          else if (current.replace('-', '').replace('.', '').length < MAX_LEN) {
            st = { ...st, entry: current + digit }
          }
          return st
        }
        case 'dot': {
          if (st.solved) st = makeState()
          if (st.fresh) st = { ...st, entry: '0', fresh: false }
          if (!st.entry.includes('.')) st = { ...st, entry: st.entry + '.' }
          return st
        }
        case 'op': {
          if (st.solved) st = { ...st, acc: parseEntry(st.entry), op: null, solved: false }
          const current = parseEntry(st.entry)
          if (st.op && st.acc !== null && !st.fresh) {
            const result = compute(st.acc, current, st.op)
            if (result === null) {
              return { ...st, error: translate('error.divideByZero'), entry: '0', acc: null, op: null, fresh: true, expr: '', solved: false }
            }
            st = { ...st, acc: result, entry: format(result) || '0' }
          } else if (st.acc === null) {
            st = { ...st, acc: current }
          }
          const left = format(st.acc)
          return { ...st, op: action.op, fresh: true, solved: false, expr: (left || '0') + ' ' + OP_GLYPH[action.op] }
        }
        case 'eq': {
          if (st.acc === null || st.op === null) {
            return { ...st, solved: true, fresh: true, expr: st.entry + ' =' }
          }
          const right = st.fresh ? st.acc : parseEntry(st.entry)
          const result = compute(st.acc, right, st.op)
          const label = (format(st.acc) || '0') + ' ' + OP_GLYPH[st.op] + ' ' + (format(right) || '0') + ' ='
          if (result === null) {
            return { ...st, error: translate('error.divideByZero'), entry: '0', acc: null, op: null, fresh: true, expr: label, solved: false }
          }
          return { ...st, entry: format(result) || '0', acc: result, op: null, fresh: true, solved: true, expr: label }
        }
        case 'back': {
          if (st.fresh || st.solved) return { ...st, entry: '0', fresh: false, solved: false, expr: '' }
          const next = st.entry.length > 1 ? st.entry.slice(0, -1) : '0'
          return { ...st, entry: next === '-' ? '0' : next }
        }
        case 'sign': {
          if (st.entry === '0') return st
          return { ...st, entry: st.entry.startsWith('-') ? st.entry.slice(1) : '-' + st.entry }
        }
        case 'pct': {
          const value = parseEntry(st.entry) / 100
          return { ...st, entry: format(value) || '0', fresh: false, solved: false }
        }
        default:
          return st
      }
    }

    // -------------------------------------------------------------- ui state
    const store = { open: false, listeners: new Set() }

    function setOpen(value) {
      const next = !!value
      if (store.open === next) return
      store.open = next
      store.listeners.forEach((listener) => {
        try {
          listener(next)
        } catch (_) {
          /* one bad subscriber must not break the others */
        }
      })
    }

    function useOpen() {
      const [open, setLocal] = React.useState(store.open)
      React.useEffect(() => {
        const listener = (value) => setLocal(value)
        store.listeners.add(listener)
        setLocal(store.open)
        return () => {
          store.listeners.delete(listener)
        }
      }, [])
      return open
    }

    // ------------------------------------------------------------ components
    function Glyph() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 18,
          height: 18,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        h('rect', { x: 4.5, y: 2.5, width: 15, height: 19, rx: 3 }),
        h('rect', { x: 7.5, y: 5.5, width: 9, height: 3.5, rx: 1 }),
        h('path', { d: 'M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 17h.01M12 17h.01M16.5 17h.01' }),
      )
    }

    function Toggle(props) {
      const open = useOpen()
      const wide = !!(props && props.wide)
      const label = translate(open ? 'action.close' : 'action.open')
      return h(
        'button',
        {
          type: 'button',
          className: 'dshcalc-toggle',
          'aria-pressed': open ? 'true' : 'false',
          'aria-label': label,
          title: label,
          onClick: () => setOpen(!store.open),
        },
        h(Glyph, null),
        wide ? h('span', { className: 'dshcalc-toggle-label' }, translate('title')) : null,
      )
    }

    const digitKey = (value) => ({ id: String(value), label: String(value), cls: '', action: { type: 'digit', value } })
    const opKey = (id, glyph, op) => ({ id, label: glyph, cls: 'dshcalc-key-op', action: { type: 'op', op } })

    const KEYS = [
      { id: 'clear', label: 'AC', cls: 'dshcalc-key-fn', action: { type: 'clear' } },
      { id: 'back', label: '\u232b', cls: 'dshcalc-key-fn', action: { type: 'back' } },
      { id: 'pct', label: '%', cls: 'dshcalc-key-fn', action: { type: 'pct' } },
      opKey('div', '\u00f7', 'div'),
      digitKey(7),
      digitKey(8),
      digitKey(9),
      opKey('mul', '\u00d7', 'mul'),
      digitKey(4),
      digitKey(5),
      digitKey(6),
      opKey('sub', '\u2212', 'sub'),
      digitKey(1),
      digitKey(2),
      digitKey(3),
      opKey('add', '+', 'add'),
      { id: 'sign', label: '\u00b1', cls: 'dshcalc-key-fn', action: { type: 'sign' } },
      digitKey(0),
      { id: 'dot', label: '.', cls: '', action: { type: 'dot' } },
      { id: 'eq', label: '=', cls: 'dshcalc-key-eq', action: { type: 'eq' } },
    ]

    function App() {
      const open = useOpen()
      const [state, setState] = React.useState(makeState)
      const rootRef = React.useRef(null)

      React.useEffect(() => {
        if (!open) return
        const element = rootRef.current
        if (!element || typeof element.focus !== 'function') return
        try {
          element.focus({ preventScroll: true })
        } catch (_) {
          /* focusing is a convenience, never a requirement */
        }
      }, [open])

      // Close on any pointer press outside the panel. The sidebar toggle is
      // excluded because its own onClick already toggles the panel.
      React.useEffect(() => {
        if (!open || typeof document === 'undefined') return undefined
        const onPointerDown = (event) => {
          const element = rootRef.current
          if (element && typeof element.contains === 'function' && element.contains(event.target)) return
          const target = event.target
          if (target && typeof target.closest === 'function' && target.closest('.dshcalc-toggle')) return
          setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
        }
      }, [open])

      const dispatch = (action) => setState((prev) => reduce(prev, action))

      if (!open) return null

      const refocus = () => {
        const element = rootRef.current
        if (!element || typeof element.focus !== 'function') return
        try {
          element.focus({ preventScroll: true })
        } catch (_) {
          /* ignore */
        }
      }

      const onKeyDown = (event) => {
        const key = event.key
        if (key === 'Escape') {
          event.preventDefault()
          setOpen(false)
          return
        }
        let action = null
        if (/^[0-9]$/.test(key)) action = { type: 'digit', value: Number(key) }
        else if (key === '.' || key === ',') action = { type: 'dot' }
        else if (key === '+') action = { type: 'op', op: 'add' }
        else if (key === '-') action = { type: 'op', op: 'sub' }
        else if (key === '*' || key === 'x' || key === 'X') action = { type: 'op', op: 'mul' }
        else if (key === '/') action = { type: 'op', op: 'div' }
        else if (key === '%') action = { type: 'pct' }
        else if (key === 'Enter' || key === '=') action = { type: 'eq' }
        else if (key === 'Backspace') action = { type: 'back' }
        else if (key === 'Delete' || key === 'c' || key === 'C') action = { type: 'clear' }
        if (!action) return
        event.preventDefault()
        dispatch(action)
      }

      const display = state.error ? state.error : state.entry

      return h(
        'div',
        {
          ref: rootRef,
          className: 'dshcalc',
          role: 'group',
          tabIndex: -1,
          'aria-label': translate('title'),
          title: translate('hint.keyboard'),
          onKeyDown,
        },
        h(
          'div',
          { className: 'dshcalc-head' },
          h('span', { className: 'dshcalc-title' }, translate('title')),
          h(
            'button',
            {
              type: 'button',
              className: 'dshcalc-close',
              'aria-label': translate('button.close'),
              title: translate('button.close'),
              onClick: () => setOpen(false),
            },
            '\u00d7',
          ),
        ),
        h(
          'div',
          { className: 'dshcalc-screen' },
          h('div', { className: 'dshcalc-expr' }, state.expr || '\u00a0'),
          h('div', { className: 'dshcalc-value' + (state.error ? ' is-error' : '') }, display),
        ),
        h(
          'div',
          { className: 'dshcalc-grid' },
          KEYS.map((key) =>
            h(
              'button',
              {
                key: key.id,
                type: 'button',
                className: 'dshcalc-key' + (key.cls ? ' ' + key.cls : ''),
                'aria-label': key.id === 'back' ? 'Backspace' : key.label,
                onClick: () => {
                  dispatch(key.action)
                  refocus()
                },
              },
              key.label,
            ),
          ),
        ),
      )
    }

    // ------------------------------------------------------------- stylesheet
    const CSS = `
.dshcalc-toggle{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:32px;padding:0 6px;box-sizing:border-box;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;transition:background 120ms ease,color 120ms ease}
.dshcalc-toggle:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshcalc-toggle[aria-pressed="true"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-brand-primary)}
.dshcalc-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.dshcalc-toggle svg{display:block;width:18px;height:18px}
.dshcalc-toggle-label{font-size:12px;line-height:1;white-space:nowrap}

.dshcalc{position:fixed;left:12px;bottom:60px;z-index:60;width:276px;max-height:calc(100vh - 96px);overflow:auto;box-sizing:border-box;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);box-shadow:0 12px 32px rgba(0,0,0,.28);pointer-events:auto;outline:none;font-family:inherit}
.dshcalc,.dshcalc *{box-sizing:border-box}
.dshcalc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.dshcalc-title{font-size:12px;line-height:1;letter-spacing:.02em;color:var(--dsw-alias-label-secondary)}
.dshcalc-close{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:16px;line-height:1;cursor:pointer}
.dshcalc-close:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dshcalc-screen{margin-bottom:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);text-align:right}
.dshcalc-expr{min-height:15px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshcalc-value{font-size:26px;font-weight:600;line-height:1.25;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dshcalc-value.is-error{font-size:15px;font-weight:500;line-height:1.55;color:var(--dsw-alias-state-error-primary);white-space:normal}
.dshcalc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.dshcalc-key{height:44px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:16px;line-height:1;cursor:pointer;transition:background 100ms ease,border-color 100ms ease}
.dshcalc-key:hover{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}
.dshcalc-key:active{background:var(--dsw-alias-bg-base)}
.dshcalc-key:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dshcalc-key-op{color:var(--dsw-alias-brand-primary);font-weight:600}
.dshcalc-key-fn{font-size:14px;color:var(--dsw-alias-label-secondary)}
.dshcalc-key-eq{background:var(--dsw-alias-brand-primary);border-color:transparent;color:var(--dsw-alias-bg-base);font-weight:600}
.dshcalc-key-eq:hover{filter:brightness(1.06);background:var(--dsw-alias-brand-primary)}
`

    // ----------------------------------------------------------------- apply
    function apply(ctx) {
      let locale = null
      try {
        locale = ctx.locale || null
      } catch (_) {
        locale = null
      }

      const pick = () => {
        let active = ''
        try {
          const snapshot = locale && typeof locale.getLocale === 'function' ? locale.getLocale() : null
          active = String((snapshot && snapshot.active) || '')
        } catch (_) {
          active = ''
        }
        dict = /^zh/i.test(active) ? ZH : EN
      }

      pick()
      if (locale && typeof locale.bind === 'function') {
        try {
          bound = locale.bind(NS)
        } catch (_) {
          bound = null
        }
      }
      if (locale && typeof locale.subscribe === 'function') {
        ctx.effect(() =>
          locale.subscribe(() => {
            pick()
          }),
        )
      }

      // The module loader claims un-tagged <style> elements created while a
      // bundle is being applied, so this stylesheet is removed with the plugin.
      ctx.effect(() => {
        if (typeof document === 'undefined' || !document.head) return () => {}
        const style = document.createElement('style')
        style.setAttribute('data-dshcalc', '')
        style.textContent = CSS
        document.head.appendChild(style)
        return () => {
          try {
            style.remove()
          } catch (_) {
            /* already detached */
          }
        }
      }, 'dsh-calculator: stylesheet')

      const registerLocale = (tag, table) => {
        if (!locale || typeof locale.register !== 'function') return
        ctx.effect(() => {
          try {
            const dispose = locale.register(NS, tag, table)
            return () => {
              if (typeof dispose === 'function') dispose()
            }
          } catch (_) {
            return () => {}
          }
        })
      }
      registerLocale('en', EN)
      registerLocale('zh', ZH)

      ctx.slots.inject('sidebar.footer.action', () =>
        ctx.slots.register(
          { name: 'sidebar.footer.action', id: 'calculator-toggle', order: 6, label: () => translate('title') },
          Toggle,
        ),
      )

      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'calculator', order: 50, label: () => translate('title') }, App),
      )
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
