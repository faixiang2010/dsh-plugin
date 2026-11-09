// Offline check for the calculator client bundle: loads client.js with a mock
// module loader + mock React, then drives the real components through their
// event handlers and asserts the displayed value.

const loaded = { spec: null }
globalThis.window = { __ModuleLoader__: { load: (spec) => (loaded.spec = spec) } }

const HOOKS = { values: [], cursor: 0, effects: [], dirty: false }

const React = {
  createElement(type, props, ...children) {
    return {
      type,
      props: props || {},
      children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false),
    }
  },
  useState(initial) {
    const i = HOOKS.cursor++
    if (!HOOKS.values[i]) HOOKS.values[i] = { kind: 'state', value: typeof initial === 'function' ? initial() : initial }
    const slot = HOOKS.values[i]
    return [
      slot.value,
      (next) => {
        slot.value = typeof next === 'function' ? next(slot.value) : next
        HOOKS.dirty = true
      },
    ]
  },
  useEffect(fn) {
    HOOKS.effects.push(fn)
  },
  useRef(initial) {
    const i = HOOKS.cursor++
    if (!HOOKS.values[i]) HOOKS.values[i] = { kind: 'ref', ref: { current: initial } }
    return HOOKS.values[i].ref
  },
}

const ReactNS = { default: React, ...React }
const req = (id) => {
  if (id === 'react') return ReactNS
  throw new Error('unexpected require: ' + id)
}

await import('./dsh-calculator/client.js?syntaxcheck')
if (!loaded.spec) throw new Error('client bundle did not call __ModuleLoader__.load')
if (loaded.spec.id !== '@local/dsh-calculator') throw new Error('unexpected module id: ' + loaded.spec.id)

const api = loaded.spec.factory(req)
if (!api || typeof api.apply !== 'function') throw new Error('factory did not return { apply }')

const registered = []
const injected = []
const ctx = {
  effect(fn) {
    const dispose = fn()
    return typeof dispose === 'function' ? dispose : () => {}
  },
  styles: { insert: () => () => {} },
  locale: {
    getLocale: () => ({ active: 'en' }),
    bind: () => (key) => key,
    subscribe: () => () => {},
    register: () => () => {},
  },
  slots: {
    inject(name, cb) {
      injected.push(name)
      cb()
    },
    register(reg, component) {
      registered.push({ reg, component })
      return () => {}
    },
  },
}

api.apply(ctx)
if (injected.length !== 2) throw new Error('expected 2 slot injections, got ' + injected.join(','))
const ids = registered.map((r) => r.reg.id).sort()
if (ids.join(',') !== 'calculator,calculator-toggle') throw new Error('unexpected slot occupants: ' + ids.join(','))
for (const entry of registered) {
  if (entry.reg.name !== entry.reg.name.toLowerCase()) throw new Error('slot name not copied')
}

const Toggle = registered.find((r) => r.reg.id === 'calculator-toggle').component
const App = registered.find((r) => r.reg.id === 'calculator').component

function walk(node, out = []) {
  if (node === null || node === undefined) return out
  if (typeof node !== 'object') return out
  out.push(node)
  for (const child of node.children || []) walk(child, out)
  return out
}
const render = (component, props) => {
  HOOKS.cursor = 0
  HOOKS.effects = []
  const tree = component(props)
  for (const effect of HOOKS.effects) effect()
  return tree
}
const textOf = (node) => (node.children || []).filter((c) => typeof c === 'string').join('')

let tree = render(Toggle, { wide: false })
const toggleButton = walk(tree).find((n) => n.type === 'button')
if (!toggleButton) throw new Error('toggle button missing')
if (toggleButton.props.className !== 'dshcalc-toggle') throw new Error('unexpected toggle class: ' + toggleButton.props.className)
if (walk(tree).some((n) => n.props && n.props.className === 'dshcalc-toggle-label')) throw new Error('rail must not show a label')
if (toggleButton.props.title !== 'Open calculator') throw new Error('unexpected toggle title: ' + toggleButton.props.title)

let wideTree = render(Toggle, { wide: true })
const label = walk(wideTree).find((n) => n.props && n.props.className === 'dshcalc-toggle-label')
if (!label || textOf(label) !== 'Calculator') throw new Error('wide toggle label missing')

toggleButton.props.onClick()
tree = render(App, {})

const panel = walk(tree).find((n) => n.props && n.props.className === 'dshcalc')
if (!panel) throw new Error('panel did not open')
const value = () => {
  const node = walk(tree).find((n) => n.props && String(n.props.className).includes('dshcalc-value'))
  return textOf(node)
}
const expr = () => {
  const node = walk(tree).find((n) => n.props && n.props.className === 'dshcalc-expr')
  return textOf(node).replace(/\u00a0/g, '').trim()
}
const press = (label) => {
  const button = walk(tree).find((n) => n.type === 'button' && textOf(n) === label && String(n.props.className).includes('dshcalc-key'))
  if (!button) throw new Error('key not found: ' + label)
  button.props.onClick()
  tree = render(App, {})
}

const expect = (actual, expected, what) => {
  if (actual !== expected) throw new Error(what + ': expected "' + expected + '" but got "' + actual + '"')
}

expect(value(), '0', 'initial display')
press('7')
press('+')
press('8')
press('=')
expect(value(), '15', '7+8')
expect(expr(), '7 + 8 =', 'expression line')

press('AC')
expect(value(), '0', 'clear')
press('0')
press('.')
press('1')
press('+')
press('0')
press('.')
press('2')
press('=')
expect(value(), '0.3', '0.1+0.2 rounding')

press('AC')
press('2')
press('+')
press('3')
press('\u00d7')
press('4')
press('=')
expect(value(), '20', 'left-to-right chaining')

press('AC')
press('9')
press('\u00f7')
press('0')
press('=')
expect(value(), 'Cannot divide by zero', 'divide by zero')
press('7')
expect(value(), '7', 'error recovers on next digit')

press('AC')
press('5')
press('+')
press('=')
expect(value(), '10', 'missing operand repeats left')

press('AC')
press('1')
press('2')
press('3')
press('\u232b')
press('\u232b')
expect(value(), '1', 'backspace')

press('AC')
press('4')
press('\u00b1')
expect(value(), '-4', 'sign toggle')

press('AC')
press('4')
press('%')
expect(value(), '0.04', 'percent')

press('AC')
press('3')
press('\u00f7')
press('3')
press('=')
press('+')
press('1')
press('=')
expect(value(), '2', 'continue from result')

press('AC')
press('1')
press('0')
press('\u00d7')
press('1')
press('0')
press('=')
press('+')
expect(value(), '100', 'operator after equals keeps result')
expect(expr(), '100 +', 'operator expression')

// Chinese locale and keyboard handling through the panel element.
const zhCtx = {
  ...ctx,
  locale: { getLocale: () => ({ active: 'zh-CN' }), bind: () => (k) => k, subscribe: () => () => {}, register: () => () => {} },
  slots: { inject: (name, cb) => cb(), register: (reg, component) => { registered.push({ reg, component }); return () => {} } },
}
api.apply(zhCtx)
const zhToggleTree = render(Toggle, { wide: true })
const zhButton = walk(zhToggleTree).find((n) => n.type === 'button')
expect(zhButton.props.title === '打开计算器' || zhButton.props.title === '关闭计算器', true, 'zh toggle title')

const keyHandlers = panel.props.onKeyDown
if (typeof keyHandlers !== 'function') throw new Error('panel has no keydown handler')
const keyEvent = (key) => {
  let prevented = false
  return [{ key, preventDefault: () => (prevented = true) }, () => prevented]
}
const typeKey = (key) => {
  const [event] = keyEvent(key)
  keyHandlers(event)
  tree = render(App, {})
}
press('AC')
typeKey('4')
typeKey('2')
expect(value(), '42', 'keyboard digits')
typeKey('*')
typeKey('2')
typeKey('Enter')
expect(value(), '84', 'keyboard multiply + enter')
typeKey('Escape')
tree = render(App, {})
if (walk(tree).some((n) => n.props && n.props.className === 'dshcalc')) throw new Error('Escape did not close the panel')

console.log('client bundle checks: OK')
