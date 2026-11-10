/**
 * Resolve the upstream DeepSeek Harness checkout root.
 *
 * Priority:
 *   1. DSH_SOURCE environment variable (absolute or relative to cwd)
 *   2. Adjacent siblings of this customization project (../deepseek-harness, ../../deepseek-harness, ...)
 *   3. Return the first candidate that exists on disk, else the first one (for error surfacing).
 *
 * Every script in this project should import `findDshRoot` from here instead of
 * recomputing candidate paths locally. The resolved path is cached per process.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

let _cache = null

export function findDshRoot() {
  if (_cache) return _cache
  const thisDir = resolve(import.meta.dirname)
  const root = resolve(thisDir, '..')

  const candidates = []

  // 1. Explicit override via env var
  if (process.env.DSH_SOURCE) {
    candidates.push(resolve(process.cwd(), process.env.DSH_SOURCE))
  }

  // 2. Sibling guesses at progressively higher levels.
  //    ../deepseek-harness     → README convention (when xuya and DSH are siblings)
  //    ../../deepseek-harness  → common layout (dsh-plugin/deepseek-harness-xuya next to deepseek-harness)
  //    ../../../deepseek-harness, ... → fallback up to 6 levels
  for (let depth = 1; depth <= 6; depth++) {
    candidates.push(resolve(root, ...Array(depth).fill('..'), 'deepseek-harness'))
  }

  _cache = candidates.find(p => existsSync(p)) ?? candidates[0]
  return _cache
}

/** Reset the cache (useful for tests that mutate DSH_SOURCE). */
export function _reset() { _cache = null }
