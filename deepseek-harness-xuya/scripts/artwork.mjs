/** Generate Windows artwork and NSIS palette from the shared brand document. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function buildWindowsArtwork(root, source, brand, sharp, iconSvg) {
 const { packIco } = await import(pathToFileURL(join(source, 'apps/desktop/scripts/render-tray-icon.ts')).href)
 const entries = await Promise.all([16,20,24,32,40,48,64,128,256].map(async size => ({size, png:await sharp(Buffer.from(iconSvg)).resize(size,size).png().toBuffer()})))
 writeFileSync(join(root,'assets/tray-windows.ico'),packIco(entries))
 const directory=join(root,'assets/installer');mkdirSync(directory,{recursive:true})
 for(const [file,width,height,dark] of [['brand',600,196,false],['brand-2x',1200,392,false],['brand-dark',600,196,true],['brand-dark-2x',1200,392,true],['uninstaller-sidebar',164,314,false]]) {
  const p=dark?brand.dark:brand.light
  const sidebar=file==='uninstaller-sidebar'
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(sidebar?'164 314':'600 196')+'"><rect width="100%" height="100%" fill="'+p.canvas+'"/><rect x="'+(sidebar?46:274)+'" y="'+(sidebar?76:16)+'" width="'+(sidebar?72:52)+'" height="'+(sidebar?72:52)+'" rx="18" fill="'+p.brandSoft+'"/><text x="'+(sidebar?82:300)+'" y="'+(sidebar?128:55)+'" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="'+(sidebar?48:36)+'" fill="'+p.brandInk+'">'+brand.mark+'</text><text x="'+(sidebar?82:300)+'" y="'+(sidebar?183:110)+'" text-anchor="middle" font-family="Microsoft YaHei,sans-serif" font-size="'+(sidebar?26:28)+'" fill="'+p.ink+'">'+brand.name+'</text><text x="'+(sidebar?82:300)+'" y="'+(sidebar?212:140)+'" text-anchor="middle" font-family="sans-serif" font-size="'+(sidebar?12:16)+'" fill="'+p.muted+'">'+brand.englishName+'</text></svg>'
  await sharp(Buffer.from(svg)).resize(width,height).flatten({background:p.canvas}).png().toFile(join(directory,file+'.png'))
 }
 const hex=value=>value.slice(1).toUpperCase()
 const argb=value=>'0xFF'+hex(value)
 const colorref=value=>'0x'+hex(value).match(/../g).reverse().join('')
 const resolve=p=>[
  'StrCpy $InstallerBgHex "'+hex(p.canvas)+'"', 'StrCpy $InstallerTextHex "'+hex(p.ink)+'"',
  'StrCpy $InstallerBgArgb '+argb(p.canvas), 'StrCpy $InstallerBgColorref '+colorref(p.canvas),
  'StrCpy $InstallerTextColorref '+colorref(p.ink), 'StrCpy $InstallerPrimary '+argb(p.infoFill),
  'StrCpy $InstallerPrimaryHover '+argb(p.infoHover), 'StrCpy $InstallerPrimaryPressed '+argb(p.infoHover),
  'StrCpy $InstallerControlHover '+argb(p.soft), 'StrCpy $InstallerControlPressed '+argb(p.brandSoft),
  'StrCpy $InstallerTrack '+argb(p.line), 'StrCpy $InstallerButtonText 0xFFFFFF', 'StrCpy $InstallerBorder '+argb(p.lineStrong)
 ].join(String.fromCharCode(10))
 const condition='$'+'{If} $InstallerTheme == "dark"'
 const otherwise='$'+'{Else}', end='$'+'{EndIf}'
 const colors=p=>'SetCtlColors '+'$'+'{HANDLE} '+hex(p.ink)+' '+hex(p.canvas)
 writeFileSync(join(root,'assets/installer-theme.nsh'),[
  '; Generated from brand.json.', '!macro ProductInstallerResolveTheme',condition,resolve(brand.dark),otherwise,resolve(brand.light),end,'!macroend',
  '!macro ProductInstallerControlColors HANDLE',condition,colors(brand.dark),otherwise,colors(brand.light),end,'!macroend',''
 ].join(String.fromCharCode(10)))
}
