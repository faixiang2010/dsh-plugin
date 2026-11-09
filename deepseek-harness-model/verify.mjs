#!/usr/bin/env node
/**
 * 大伟模式实验验证脚本（零依赖）。
 *
 * 三层判定：
 *   A 装配：profile 组合包含本组合包；组合 dump 里出现「大伟模式」且排序最末。
 *   B 隔离：除 dawei 预设外没有任何预设引用本插件的探针行。
 *   C 行为：探针自检返回 DAWEI-MODE-OK；界面里真实跑过一次后证据文件有非本地记录。
 *
 * 用法：
 *   node verify.mjs                 跑 A+B+C（C 的证据缺失时报告 PENDING，不算失败）
 *   node verify.mjs --skip-dump     跳过组合 dump（不依赖 dsh 源码）
 *   node verify.mjs --evidence-only 只判行为证据
 */

import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SELF = 'deepseek-harness-model'
const PRESET_ID = 'dawei'
const MARKER = 'DAWEI-MODE-OK'
const REPO = process.env.DSH_SOURCE ?? 'D:\\electron\\deepseek-harness'
const args = new Set(process.argv.slice(2))

const failures = []
const pending = []

/**
 * 记录一条判定。
 * @param {boolean} ok - 是否通过。
 * @param {string} label - 检查项。
 * @param {string} detail - 证据或原因。
 */
function check(ok, label, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail === undefined ? '' : ` — ${detail}`}`)
  if (!ok) failures.push(label)
}

/** @returns DSH home 目录。 */
function dshHome() {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

/** @returns 证据文件路径。 */
function evidenceFile() {
  return join(dshHome(), 'dawei-mode', 'evidence.jsonl')
}

/** 装配检查：至少一个 profile 清单已选择本组合包。 */
function checkInstall() {
  const selected = []
  const scanned = []
  for (const profile of ['web', 'desktop']) {
    const manifestPath = join(dshHome(), 'profiles', profile, 'package.json')
    if (!existsSync(manifestPath)) continue
    scanned.push(profile)
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    if ((manifest?.dsh?.profile?.bundles ?? []).includes(SELF)) selected.push(profile)
  }
  check(selected.length > 0, 'A1 组合包已安装并启用', selected.length > 0 ? `${selected.join(', ')}（已扫描 ${scanned.join(', ')}）` : `已扫描 ${scanned.join(', ') || '无'}，均未选择本组合包`)
}

/**
 * 从组合 dump 中解析所有 Agent 预设声明。
 * @param {string} text - dump 输出。
 * @returns {{ rowId: string, id: string, name?: string, order?: string, block: string }[]}
 */
function parsePresets(text) {
  const lines = text.split(/\r?\n/)
  const rows = []
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)name: '@deepseek-ai\/dsh-agent-preset'\s*$/.exec(lines[i])
    if (match === null) continue
    const indent = match[1].length
    let end = lines.length
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '') continue
      const lineIndent = lines[j].length - lines[j].trimStart().length
      if (lineIndent <= indent && /^\s*- /.test(lines[j])) { end = j; break }
    }
    const block = lines.slice(i, end)
    const meta = {}
    let metaIndent = Infinity
    for (const line of block.slice(1)) {
      const trimmed = line.trim()
      if (trimmed === 'plugins:') break
      const lineIndent = line.length - line.trimStart().length
      if (lineIndent > indent && lineIndent < metaIndent) metaIndent = lineIndent
      const kv = /^(id|name|order):\s*(.*)$/.exec(trimmed)
      if (kv === null || lineIndent !== metaIndent) continue
      if (meta[kv[1]] === undefined) meta[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim()
    }
    rows.push({ rowId: meta.id, id: meta.id, name: meta.name, order: meta.order, block: block.join('\n') })
  }
  return rows
}

/**
 * 装配检查：组合 dump 中的预设声明与排序。
 * @param {string} text - dump 输出。
 */
function checkComposition(text) {
  const presets = parsePresets(text).filter(row => row.id !== undefined)
  const dawei = presets.find(row => row.id === PRESET_ID)
  check(dawei !== undefined, 'A2 组合包含大伟模式声明', dawei === undefined ? 'dump 中未找到 id=dawei 的预设' : `name=${dawei.name ?? '(未命名)'} order=${dawei.order ?? '(未设置)'}`)
  if (dawei === undefined) return
  check(dawei.name === '大伟模式', 'A3 显示名为「大伟模式」', dawei.name ?? '')

  const byId = new Map()
  for (const row of presets) byId.set(`${row.id}|${row.order ?? ''}`, row)
  const roster = [...byId.values()].sort((a, b) => {
    const oa = a.order === undefined ? Number.POSITIVE_INFINITY : Number(a.order)
    const ob = b.order === undefined ? Number.POSITIVE_INFINITY : Number(b.order)
    return oa - ob || a.id.localeCompare(b.id)
  })
  const last = roster[roster.length - 1]
  check(last?.id === PRESET_ID, 'A4 大伟模式排在列表最下面', roster.map(row => `${row.id}(${row.order ?? '∞'})`).join(' < '))

  const leaked = presets.filter(row => row.id !== PRESET_ID && row.block.includes(`name: '${SELF}'`))
  check(leaked.length === 0, 'B1 探针行只在 dawei 预设内', leaked.map(row => row.id).join(', ') || '无泄漏')
}

/** 探针自检：不启动模型，直接调用工具执行体。 */
async function checkProbe() {
  const mod = await import(new URL('./index.js', import.meta.url))
  let definition
  mod.apply({ tools: { register: value => { definition = value } } }, { mode: PRESET_ID })
  check(definition?.name === 'dawei_probe', 'C1 探针工具已注册', definition?.name ?? '未注册')
  if (definition === undefined) return
  const value = await definition.execute({}, { agent: { id: 'verify-local' } })
  const ok = value.marker === MARKER && value.mode === PRESET_ID && value.tool === 'dawei_probe'
  check(ok, 'C2 探针返回模式标记', `${value.marker} mode=${value.mode}`)
  check(existsSync(value.evidencePath), 'C3 探针写入证据行', value.evidencePath)
}

/** 行为证据：界面里真实运行过的一次探针调用。 */
function checkEvidence() {
  const path = evidenceFile()
  if (!existsSync(path)) {
    pending.push('C4 真实运行证据')
    console.log(`PENDING  C4 真实运行证据 — 尚无 ${path}，请完成界面自检实验`)
    return
  }
  const entries = readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean).map(line => {
    try { return JSON.parse(line) } catch { return undefined }
  }).filter(Boolean)
  const real = entries.filter(entry => entry.sessionId !== 'verify-local' && entry.marker === MARKER)
  if (real.length === 0) {
    pending.push('C4 真实运行证据')
    console.log('PENDING  C4 真实运行证据 — 只有本地自检记录，请在界面里让大伟模式调用一次 dawei_probe')
    return
  }
  check(true, 'C4 真实运行证据', `${real.length} 条，最新 ${real[real.length - 1].timestamp} session=${real[real.length - 1].sessionId}`)
}

/** 运行组合 dump；dump 不启动进程、不评估 !!js。desktop 由 Electron 独占，默认用同构的 web。 */
function dumpComposition() {
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx/esm', 'apps/cli/src/bin.ts', '--profile', process.env.DSH_PROFILE ?? 'web', '--dump-config', '--patch', join(HERE, 'cordis.patch.yml')],
    { cwd: REPO, encoding: 'utf8', timeout: 120000, windowsHide: true },
  )
  if (result.status !== 0) {
    check(false, 'A0 组合 dump', `退出码 ${result.status}：${(result.stderr ?? '').trim().split(/\r?\n/).slice(-3).join(' | ')}`)
    return
  }
  checkComposition(result.stdout ?? '')
}

console.log(`大伟模式验证 — ${HERE}\n`)

if (!args.has('--evidence-only')) {
  if (!args.has('--skip-dump')) {
    if (existsSync(join(REPO, 'apps', 'cli', 'src', 'bin.ts'))) dumpComposition()
    else check(false, 'A0 组合 dump', `找不到 dsh 源码 ${REPO}，可用 DSH_SOURCE 指定或加 --skip-dump`)
  }
  checkInstall()
  await checkProbe()
}
checkEvidence()

console.log(`
下一步（行为对照实验）：
1. 已安装到 desktop profile（link），重启 DSH 桌面端让组合重新加载。
2. 新建任务时在模式列表最下面选「大伟模式」，输入：大伟自检
3. 对照组：另一个任务用「标准模式」问同一句 —— 它没有 dawei_probe，无法产出标记。
4. 再跑 node verify.mjs，C4 通过即说明模式作用域与工具贡献真实生效。`)

if (failures.length > 0) {
  console.log(`\n结果：FAIL（${failures.length} 项未通过：${failures.join('、')}）`)
  process.exitCode = 1
} else {
  console.log(`\n结果：PASS${pending.length === 0 ? '' : `（证据阶段待完成：${pending.join('、')}）`}`)
}
