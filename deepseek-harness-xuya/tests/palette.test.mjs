import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { paletteTokens, bootCss } from '../scripts/palette.mjs'
const brand=JSON.parse(readFileSync(new URL('../brand.json',import.meta.url),'utf8'))
test('pre-client colors equal the live theme in both modes',()=>{
 const tokens=paletteTokens(brand)
 assert.equal(tokens['--dsw-alias-bg-base'].light,'#f4f2ec')
 assert.equal(tokens['--dsw-alias-bg-base'].dark,'#19231f')
 for(const [name,value]of Object.entries(tokens)){
  assert.equal(typeof value.light,'string',name);assert.equal(typeof value.dark,'string',name)
  assert.ok(bootCss(tokens).includes(name+':'+value.dark))
 }
})
test('text and primary actions retain AA contrast in both modes',()=>{
 const lum=hex=>{const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722}
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05)
 for(const p of [brand.light,brand.dark]){assert.ok(ratio(p.ink,p.canvas)>=4.5);assert.ok(ratio(p.muted,p.canvas)>=4.5);assert.ok(ratio(p.onBrand,p.brand)>=4.5)}
})
