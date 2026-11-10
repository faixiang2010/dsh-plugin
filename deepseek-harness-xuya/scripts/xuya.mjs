/** Xuya build and launch entry. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { paletteTokens, bootCss } from './palette.mjs'
import { buildWindowsArtwork } from './artwork.mjs'
import { findDshRoot } from './find-dsh.mjs'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const source=findDshRoot()
const brandFile=join(root,'brand.json')
const brand=JSON.parse(readFileSync(brandFile,'utf8'))
const upstream=JSON.parse(readFileSync(join(root,'upstream.json'),'utf8'))
const hostRequire=createRequire(join(source,'package.json'))
const ownRequire=createRequire(join(root,'package.json'))
const env={...process.env,DSH_BRAND_CONFIG:brandFile,DSH_SOURCE:source}
function run(args,cwd=source,extra={}){
 const result=spawnSync(process.execPath,args,{cwd,env:{...env,...extra},stdio:'inherit',windowsHide:true})
 if(result.error)throw result.error
 if(result.status!==0)throw new Error('Command failed: '+args.join(' '))
}
function pnpm(args,cwd=source,extra={}){const file=hostRequire.resolve('pnpm');const manifest=JSON.parse(readFileSync(file,'utf8'));run([resolve(dirname(file),manifest.bin.pnpm),...args],cwd,extra)}
function killPort(port){
 const isWin=process.platform==='win32'
 const findCmd=isWin?['netstat','-ano']:['lsof','-ti',`tcp:${port}`]
 const regex=isWin?new RegExp(`:${port}\\s+.*LISTENING\\s+(\\d+)`,`g`):/\n(\d+)\n/g
 const out=spawnSync(findCmd[0],findCmd.slice(1),{encoding:'utf8',windowsHide:true})
 if(out.status!==0||!out.stdout){console.log(`XuYA: port ${port} is free`);return}
 const pids=isWin
  ? [...out.stdout.matchAll(regex)].map(m=>m[1])
  : (out.stdout.match(/^\d+$/gm)||[])
 const unique=[...new Set(pids)]
 if(unique.length===0){console.log(`XuYA: port ${port} is free`);return}
 console.log(`XuYA: killing ${unique.length} PID(s) on port ${port}: ${unique.join(', ')}`)
 for(const pid of unique){
  const kill=isWin
   ? spawnSync('taskkill',['/PID',pid,'/T','/F'],{stdio:'pipe',windowsHide:true})
   : spawnSync('kill',['-9',pid])
  if(kill.status!==0)console.warn(`XuYA: failed to kill PID ${pid}: ${kill.stderr?.toString().trim()||kill.error?.message||'unknown'}`)
 }
 // Give the OS a moment to release the socket before rebinding.
 Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,600)
 console.log('XuYA: port released')
}
function check(){
 const m=JSON.parse(readFileSync(join(source,'package.json'),'utf8'))
 if(m.version!==upstream.version)throw new Error('Review DSH compatibility: '+m.version+'; validated '+upstream.version)
 for(const p of ['packages/client/tsdown.client.ts','packages/client/ui-theme/lib/client.js','scripts/product-brand.mjs'])if(!existsSync(join(source,p)))throw new Error('Missing '+p+'; apply integration.patch and build DSH')
 console.log('XuYA: DSH '+m.version+'; baseline '+upstream.commit)
}
async function build(){
 check()
 const tokens=paletteTokens(brand)
 writeFileSync(join(root,'packages/ui/src/palette.ts'),'/** Generated from brand.json. */\nexport const brand = '+JSON.stringify(brand)+'\nexport const tokens = '+JSON.stringify(tokens)+'\nexport const bootStyles = '+JSON.stringify(bootCss(tokens))+'\n')
 const {default:sharp}=await import(pathToFileURL(ownRequire.resolve('sharp')).href)
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect x="4" y="4" width="120" height="120" rx="36" fill="'+brand.light.brandSoft+'"/><text x="64" y="88" text-anchor="middle" font-family="Microsoft YaHei, sans-serif" font-size="82" fill="'+brand.light.brandInk+'">'+brand.mark+'</text></svg>'
 mkdirSync(join(root,'assets/web'),{recursive:true})
 writeFileSync(join(root,'assets/favicon.svg'),svg)
 const wordmark='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 472 40"><rect x="2" y="1" width="38" height="38" rx="12" fill="'+brand.light.brandSoft+'"/><text x="21" y="29" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="27" fill="'+brand.light.brandInk+'">'+brand.mark+'</text><text x="54" y="29" font-family="Microsoft YaHei,sans-serif" font-size="28" fill="'+brand.light.brandInk+'">'+brand.name+'</text><text x="159" y="28" font-family="sans-serif" font-size="16" fill="'+brand.light.brandInk+'">'+brand.englishName+'</text></svg>'
 writeFileSync(join(root,'assets/welcome-brand.svg'),wordmark)
 writeFileSync(join(root,'assets/desktop.css'),bootCss(tokens)+'body{--welcome-tint:'+brand.lightBackground+';background:'+brand.lightBackground+'}body[data-ds-dark-theme]{--welcome-tint:'+brand.darkBackground+';background:'+brand.darkBackground+'}')
 for(const [file,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]])await sharp(Buffer.from(svg)).resize(size,size).png().toFile(join(root,'assets/web',file))
 await sharp(Buffer.from(svg)).resize(256,256).png().toFile(join(root,'assets/icon-windows.png'))
 await buildWindowsArtwork(root,source,brand,sharp,svg)
 for(const f of ['favicon.svg','favicon-dark.svg'])cpSync(join(root,'assets/favicon.svg'),join(root,'assets/web',f))
 writeFileSync(join(root,'assets/web/manifest.webmanifest'),JSON.stringify({name:brand.name,short_name:brand.shortName,start_url:'./',scope:'./',display:'standalone',background_color:brand.lightBackground,theme_color:brand.lightBackground,icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png'},{src:'icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},null,2)+'\n')
 run(['--import',pathToFileURL(hostRequire.resolve('tsx/esm')).href,join(root,'scripts/bundle.ts')],root)
}
async function profile(kind){
 const dir=join(root,'.runtime',kind);mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'pnpm-workspace.yaml'),'packages: [.]\n')
 writeFileSync(join(dir,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{'@deepseek-ai/dsh-xuya-ui':'file:'+join(root,'packages/ui')}},null,2)+'\n')
 pnpm(['install','--ignore-scripts','--config.auto-install-peers=false'],dir)
 const overlay=join(dir,'overlay.yml')
 writeFileSync(overlay,JSON.stringify([{id:'ui-brand-official',disabled:true},{insert:[{id:'xuya-ui',name:join(dir,'node_modules/@deepseek-ai/dsh-xuya-ui/lib/index.js')}]}],null,2)+'\n')
 return overlay
}
const command=process.argv[2]??'check'
if(command==='check')check()
else if(command==='build')await build()
else if(command==='build-dsh'){await build();pnpm(['run','build:artifacts']);pnpm(['run','build:check'])}
else if(command==='web'||command==='desktop'){
 await build()
 const entry=await profile(command)
 if(command==='desktop'){pnpm(['run','start:desktop'],source,{DSH_DESKTOP_PATCH:entry,DSH_DESKTOP_OPEN_DEVTOOLS:'0'});process.exit(0)}
 const args=['dsh',command,'--patch',entry]
 if(command==='web'){
  args.push('--patch',join(source,'apps/web/tests/pin-browse-picker.overlay.yml'),'--no-open','--port',process.env.XUYA_WEB_PORT??'3090')
  killPort(parseInt(args[args.length-1],10))
 }
 pnpm(args,source,{DSH_XUYA_UI:entry})
}else if(command==='package-windows'){await build();const settings=join(root,'.cache/packaging');mkdirSync(join(settings,'presets'),{recursive:true});writeFileSync(join(settings,'presets/test.env'),'DSH_DESKTOP_APP_ID=com.deepseek.harness\nDSH_DESKTOP_AUTO_UPDATE_ENV=test\nDSH_DESKTOP_NPM_REGISTRY=https://registry.npmjs.org\n');pnpm(['run','package:desktop:win:x64:unsigned'],source,{DSH_PACKAGING_PRESET:'test',DSH_PACKAGING_CONFIG_DIR:settings})}
else throw new Error('Unknown command '+command)
