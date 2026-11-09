/** Host half of the Xuya theme, including its pre-client token stylesheet. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { bootStyles } from './palette.ts'

/** Insert brand colors before the browser module loader starts.
 * @param ctx Host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.on('webserver/index-inject', table => {
    table.push({ kind: 'html', placement: 'head', html: '<style data-xuya-boot>' + bootStyles + '</style>' })
  })
}
