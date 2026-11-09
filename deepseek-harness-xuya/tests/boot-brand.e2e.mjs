/** Check the production boot page with its documented readiness deferred held by the test. */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
const root=resolve(import.meta.dirname,'..')
const source=resolve(process.env.DSH_SOURCE??resolve(root,'..','deepseek-harness'))
const url=new URL(process.env.XUYA_QA_URL)
if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('XUYA_QA_URL must address the local preview')
const require=createRequire(resolve(source,'apps/web/package.json'))
const {chromium}=require('playwright')
const brand=JSON.parse(readFileSync(resolve(root,'brand.json'),'utf8'))
const browser=await chromium.launch({channel:'chrome',headless:true})
try{
 for(const mode of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1280,height:720},colorScheme:mode,serviceWorkers:'block'})
  try{
   await context.route('**/*',async route=>{
    if(new URL(route.request().url()).origin!==url.origin)await route.abort()
    else await route.continue()
   })
   const page=await context.newPage()
   await page.addInitScript(()=>{
    const gate=Promise.withResolvers()
    globalThis.__DSH_BOOT_READY__={promise:gate.promise,resolve(){},reject:gate.reject}
    globalThis.__XUYA_QA_RELEASE_BOOT__=failure=>failure===undefined?gate.resolve():gate.reject(new Error(failure))
   })
   await page.goto(url.href,{waitUntil:'domcontentloaded'})
   const boot=page.locator('[data-dsh-boot]')
   await boot.waitFor({state:'visible',timeout:15000})
   assert.ok((await boot.innerText()).includes(brand.name))
   assert.ok(!(await boot.innerText()).includes('HARNESS'))
   const expected=mode==='light'?brand.lightBackground:brand.darkBackground
   const background=await boot.evaluate(element=>getComputedStyle(element).backgroundColor)
   const rgb=expected.slice(1).match(/../g).map(value=>Number.parseInt(value,16))
   assert.equal(background,'rgb('+rgb.join(', ')+')')
   await boot.screenshot({path:resolve(root,'reports/screenshots/boot-brand'+(mode==='dark'?'-dark':'')+'.png')})
   if(mode==='light'){
    await page.evaluate(()=>globalThis.__XUYA_QA_RELEASE_BOOT__())
    await boot.waitFor({state:'detached',timeout:30000})
    console.log('Light boot displays '+brand.name+' and enters the real UI after readiness is released')
   }else{
    await page.evaluate(()=>globalThis.__XUYA_QA_RELEASE_BOOT__('Preview readiness failure'))
    await boot.getByText('Preview readiness failure',{exact:true}).waitFor()
    assert.ok((await boot.innerText()).includes(brand.name))
    assert.ok(!(await boot.innerText()).includes('HARNESS'))
    await boot.screenshot({path:resolve(root,'reports/screenshots/boot-brand-error.png')})
    console.log('Dark loading and failure pages retain '+brand.name+' and the selected palette')
   }
  }finally{await context.close()}
 }
}finally{await browser.close()}
