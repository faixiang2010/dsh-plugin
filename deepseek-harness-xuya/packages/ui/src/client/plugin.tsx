/** Xuya presentation installed through the existing theme and brand slots. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { createElement } from 'react'
import { brand, tokens } from '../palette.ts'
import css from './styles.css?inline'

/** Wait for services rather than relying on package activation order. */
export const inject = ['slots', 'theme']

/** Render the existing reference project's character mark.
 * @param props Requested logo size.
 * @returns Branded character tile.
 */
export function XuyaMark({ size = 24 }: { size?: number }) {
  return createElement('span', { className: 'xuya-mark', style: { width: size, height: size, fontSize: size * 0.64 }, 'aria-hidden': true }, brand.mark)
}

/** @returns Bilingual wordmark without a second icon. */
export function XuyaName() {
  return createElement('span', { className: 'xuya-wordmark' },
    createElement('span', null, brand.name), createElement('small', null, brand.englishName))
}

/** Register theme and brand occupants; every effect leaves with the plugin.
 * @param ctx Browser plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.theme.overrideTokens('xuya', tokens), 'xuya: palette')
  ctx.effect(() => {
    for (const boot of document.querySelectorAll('style[data-xuya-boot]')) boot.remove()
    const style = document.createElement('style')
    style.dataset.plugin = '@deepseek-ai/dsh-xuya-ui'
    style.textContent = css
    document.head.append(style)
    return () => { style.remove() }
  }, 'xuya: presentation')
  ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({ name: 'sidebar.brand.mark', priority: -100 }, XuyaMark))
  ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name', priority: -100 }, XuyaName))
  ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({ name: 'conversation.hero.brand.mark', priority: -100 }, XuyaMark))
}
