/**
 * Rewrite packages/*.package.json `link:` devDependencies to point at the
 * resolved DSH checkout. Run this once after moving DSH or setting DSH_SOURCE,
 * then `pnpm install`.
 *
 * Usage:
 *   # Auto-detect
 *   node scripts/setup-dev.mjs
 *   # Explicit override
 *   DSH_SOURCE=D:\path\to\deepseek-harness node scripts/setup-dev.mjs
 */
import { existsSync, readdirSync } from 'node:fs'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { findDshRoot } from './find-dsh.mjs'

const root = resolve(import.meta.dirname, '..')
const dsh = findDshRoot()

if (!existsSync(join(dsh, 'package.json'))) {
  console.error(`setup-dev: DSH checkout not found at ${dsh}`)
  process.exit(1)
}

const linkTargets = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-host-webserver',
  '@deepseek-ai/dsh-client-ui-theme',
  '@deepseek-ai/dsh-client-ui-renderer',
  '@deepseek-ai/dsh-client-ui-sidebar',
  '@deepseek-ai/dsh-client-ui-conversation',
]

// 1. Resolve each package's physical location under DSH.
function resolveDshPackage(name) {
  const pathMap = {
    '@deepseek-ai/cordis': 'vendor/cordis',
    '@deepseek-ai/dsh-host-webserver': 'packages/host/webserver',
    '@deepseek-ai/dsh-client-ui-theme': 'packages/client/ui-theme',
    '@deepseek-ai/dsh-client-ui-renderer': 'packages/client/ui-renderer',
    '@deepseek-ai/dsh-client-ui-sidebar': 'packages/client/ui-sidebar',
    '@deepseek-ai/dsh-client-ui-conversation': 'packages/client/ui-conversation',
  }
  const rel = pathMap[name]
  if (!rel) throw new Error(`setup-dev: unknown link target ${name}`)
  const abs = join(dsh, rel)
  if (!existsSync(join(abs, 'package.json'))) {
    throw new Error(`setup-dev: DSH package missing at ${abs}`)
  }
  return abs
}

// 2. Patch every package.json that declares these link targets.
const rootDirs = [join(root, 'packages')]
let touched = 0
for (const base of rootDirs) {
  // Walk one level (this project has only packages/ui and packages/bundle).
  const dirs = existsSync(base) ? readdirSync(base) : []
  for (const dir of dirs) {
    const pkgPath = join(base, dir, 'package.json')
    if (!existsSync(pkgPath)) continue
    const raw = readFileSync(pkgPath, 'utf8')
    const pkg = JSON.parse(raw)
    let changed = false
    for (const section of ['devDependencies', 'dependencies', 'peerDependencies']) {
      if (!pkg[section]) continue
      for (const name of Object.keys(pkg[section])) {
        if (!linkTargets.includes(name)) continue
        const absTarget = resolveDshPackage(name)
        const newValue = `link:${absTarget}`
        if (pkg[section][name] !== newValue) {
          pkg[section][name] = newValue
          changed = true
          console.log(`  ${join(dir, 'package.json')}: ${name} → ${newValue}`)
        }
      }
    }
    if (changed) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
      touched++
    }
  }
}

if (touched === 0) {
  console.log(`setup-dev: link paths already point to ${dsh} — nothing to change`)
} else {
  console.log(`setup-dev: updated ${touched} package.json file(s) → ${dsh}`)
}
