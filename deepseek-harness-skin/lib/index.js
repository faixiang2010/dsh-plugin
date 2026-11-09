/**
 * Host half of the Techno Neon skin.
 *
 * The skin is browser-only: palettes, the brand mark, and the enhancement
 * stylesheet all live in the Client bundle (`lib/client.js`). The Host half
 * stays an empty plugin so the profile row loads without side effects and the
 * bundle is a legal profile entry.
 */

/** Plugin id; matches the `id` stamped on the Client module handoff. */
export const name = 'dsh-skin-techno-neon'

/** No Host-side behaviour. */
export function apply() {}
