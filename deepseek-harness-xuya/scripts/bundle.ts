/** Build with the selected DSH checkout's module-loader protocol. */
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { findDshRoot } from './find-dsh.mjs'
const root = resolve(import.meta.dirname, '..')
const source = findDshRoot()
const require = createRequire(resolve(source, 'package.json'))
const { build } = await import(pathToFileURL(require.resolve('tsdown')).href)
const { clientBundle } = await import(pathToFileURL(resolve(source, 'packages/client/tsdown.client.ts')).href)
const packageDir = resolve(root, 'packages/ui')
process.chdir(packageDir)
for (const config of await clientBundle(packageDir, ['src/index.ts'])({env:{}})) await build({ ...config, config: false })
