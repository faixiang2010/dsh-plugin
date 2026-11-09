import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
test('a loaded browser factory retracts its styles, tokens and brand slots', () => {
 let factory
 const installed = new Set(), effects=[]
 const document={querySelectorAll(){return []},head:{append(node){installed.add(node)}},createElement(){return{dataset:{},remove(){installed.delete(this)}}}}
 const context={window:{__ModuleLoader__:{load(value){factory=value.factory}}},document}
 vm.runInNewContext(readFileSync(new URL('../packages/ui/lib/client.js',import.meta.url),'utf8'),context)
 assert.equal(typeof factory,'function')
 const plugin=factory(name=>{
  if(name==='react')return{createElement:(...args)=>args}
  throw new Error('Unexpected runtime dependency: '+name)
 })
 let tokenLayers=0, slots=0
 const ctx={
  effect(fn){effects.push(fn())},
  theme:{overrideTokens(){tokenLayers++;return()=>{tokenLayers--}}},
  slots:{
   inject(_key,fn){effects.push(fn())},
   register(){slots++;return()=>{slots--}}
  }
 }
 plugin.apply(ctx)
 assert.equal(tokenLayers,1);assert.equal(installed.size,1);assert.equal(slots,3)
 effects.reverse().forEach(dispose=>dispose?.())
 assert.equal(tokenLayers,0);assert.equal(installed.size,0);assert.equal(slots,0)
})
