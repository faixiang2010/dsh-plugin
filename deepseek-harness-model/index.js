/**
 * 大伟模式探针插件（模式作用域内挂载）。
 *
 * 该插件只作为「大伟模式」预设的子行加载，因此 `dawei_probe` 工具只存在于该模式
 * 作用域。每次调用都会返回固定的模式标记，并把一行证据追加到
 * `<DSH_HOME>/dawei-mode/evidence.jsonl`，供 verify.mjs 做实验判定。
 */

import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const name = 'deepseek-harness-model'

export const inject = ['tools']

const MARKER = 'DAWEI-MODE-OK'

/** @returns 证据文件绝对路径，遵循 DSH_HOME，默认 `~/.dsh`。 */
function evidenceFile() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
  return join(home, 'dawei-mode', 'evidence.jsonl')
}

/** 探针注册的完整 JSON 输出 schema。 */
const OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['marker', 'mode', 'sessionId', 'timestamp', 'tool', 'evidencePath'],
  properties: {
    marker: { type: 'string' },
    mode: { type: 'string' },
    sessionId: { type: 'string' },
    timestamp: { type: 'string' },
    tool: { type: 'string' },
    evidencePath: { type: 'string' },
  },
}

/**
 * 在大伟模式作用域内注册 `dawei_probe`。
 * @param ctx - 预设作用域的 Cordis 上下文（含 `tools` 服务）。
 * @param config - 预设行声明的配置；`mode` 是该工具报告的模式 id。
 */
export function apply(ctx, config) {
  const mode = config?.mode ?? 'dawei'
  ctx.tools.register({
    name: 'dawei_probe',
    description:
      '大伟模式自检探针。返回模式标记 DAWEI-MODE-OK 与证据行路径。'
      + '只有大伟模式提供这个工具；用户要求「大伟自检」或询问当前模式时必须调用它。',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: {
      schema: OUTPUT_SCHEMA,
      render: (_args, value) => [{
        type: 'text',
        text: `${value.marker} mode=${value.mode} session=${value.sessionId} evidence=${value.evidencePath}`,
      }],
    },
    execute: (_args, exec) => {
      const timestamp = new Date().toISOString()
      const sessionId = exec.agent?.session?.id ?? exec.agent?.id ?? 'unknown'
      const path = evidenceFile()
      mkdirSync(dirname(path), { recursive: true })
      appendFileSync(path, `${JSON.stringify({ marker: MARKER, mode, sessionId, timestamp, tool: 'dawei_probe' })}\n`)
      return { marker: MARKER, mode, sessionId, timestamp, tool: 'dawei_probe', evidencePath: path }
    },
  })
}
