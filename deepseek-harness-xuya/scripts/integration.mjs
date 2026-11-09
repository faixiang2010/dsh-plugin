/** Check an integration patch before changing the upstream checkout. */
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
const root=resolve(import.meta.dirname,'..')
const source=resolve(process.env.DSH_SOURCE??resolve(root,'..','deepseek-harness'))
const patch=resolve(root,'integration.patch')
const mode=process.argv[2]??'check'
if(!['check','apply','remove'].includes(mode))throw new Error('Expected check, apply or remove')
function git(args){
 const result=spawnSync('git',args,{cwd:source,stdio:'inherit',windowsHide:true})
 if(result.error)throw result.error
 return result.status
}
const reverse=mode==='apply'?[]:['--reverse']
if(git(['apply',...reverse,'--check',patch])!==0)throw new Error('Integration differs from this checkout; review the patch before proceeding')
if(mode!=='check'&&git(['apply',...reverse,patch])!==0)throw new Error('Integration operation failed')
console.log('Integration '+mode+' completed')
