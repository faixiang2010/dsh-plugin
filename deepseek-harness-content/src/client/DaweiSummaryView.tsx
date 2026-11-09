/** 「大伟总结」面板：展示模型对整段会话生成的关键信息。 */
import { useState, type ReactNode } from 'react'
import type { SummaryController, SummaryState } from './controller.ts'
import type { SummaryEntry } from './storage.ts'

/** 槽位注入面：与 index.tsx 里 register 的 inject 对应。 */
export interface SummaryViewInjected {
  readonly hooks: SummaryController['hooks']
  readonly summarize: SummaryController['summarize']
  readonly clear: SummaryController['clear']
  readonly setAuto: SummaryController['setAuto']
}

/** 运行时 props 里本组件用到的部分；hooks.summary 在组件里表现为 useSummary。 */
type SummaryViewProps = SummaryViewInjected & {
  readonly useSummary: <T>(selector: (value: SummaryState) => T) => T
}

function formatTime(time: number): string {
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '--:--'
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 极简 Markdown：只认二级标题和无序列表，其余按段落渲染。 */
function renderSummary(markdown: string) {
  const nodes: ReactNode[] = []
  let bullets: string[] = []
  const flush = (): void => {
    if (bullets.length === 0) return
    nodes.push(
      <ul className="dws-bullets" key={`ul-${nodes.length}`}>
        {bullets.map((item, index) => <li key={`${index}-${item.slice(0, 8)}`}>{item}</li>)}
      </ul>,
    )
    bullets = []
  }
  markdown.split('\n').forEach((line, index) => {
    const text = line.trim()
    if (text === '') return
    if (text.startsWith('## ')) {
      flush()
      nodes.push(<h4 className="dws-section" key={`h-${index}`}>{text.slice(3)}</h4>)
      return
    }
    const bullet = /^[-*]\s+(.*)$/.exec(text) ?? /^\d+[.、)]\s+(.*)$/.exec(text)
    if (bullet !== null) {
      bullets.push(bullet[1])
      return
    }
    flush()
    nodes.push(<p className="dws-para" key={`p-${index}`}>{text}</p>)
  })
  flush()
  return nodes
}

function EntryCard({ entry, index }: { readonly entry: SummaryEntry; readonly index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <article className="dws-card">
      <button type="button" className="dws-card-head" onClick={() => setOpen(!open)}>
        <span className="dws-round">第 {entry.round} 轮</span>
        <span className="dws-meta-text">{formatTime(entry.at)}</span>
        <span className="dws-chevron">{open ? '收起' : '展开'}</span>
      </button>
      {open && <div className="dws-body">{renderSummary(entry.summary)}</div>}
      {open && (entry.provider !== undefined || entry.model !== undefined) && (
        <div className="dws-model">{entry.provider ?? '?'} / {entry.model ?? '?'}</div>
      )}
    </article>
  )
}

export function DaweiSummaryView({ useSummary, summarize, clear, setAuto }: SummaryViewProps) {
  const state = useSummary(value => value)
  const latestFirst = [...state.entries].reverse()
  const upToDate = state.rounds > 0 && (state.entries[state.entries.length - 1]?.round ?? 0) >= state.rounds

  return (
    <div className="dws-root">
      <header className="dws-head">
        <div className="dws-head-main">
          <div className="dws-title">大伟总结</div>
          <div className="dws-sub">
            {state.running
              ? '正在让模型通读整段会话…'
              : `已完成 ${state.rounds} 轮对话 · 历史 ${state.entries.length} 条 · 存在本机`}
          </div>
        </div>
        <div className="dws-actions">
          <button
            type="button"
            className="dws-btn"
            onClick={summarize}
            disabled={state.running || state.rounds === 0}
          >
            {state.running ? '总结中…' : upToDate ? '重新总结' : '立即总结'}
          </button>
          <button
            type="button"
            className="dws-btn"
            onClick={clear}
            disabled={state.running || state.entries.length === 0}
          >
            清空
          </button>
        </div>
      </header>

      <label className="dws-switch">
        <input
          type="checkbox"
          checked={state.auto}
          onChange={event => setAuto(event.target.checked)}
        />
        <span>每轮结束后自动总结</span>
      </label>

      {state.error !== undefined && <div className="dws-error">{state.error}</div>}

      {state.entries.length === 0
        ? (
            <div className="dws-empty">
              {state.running
                ? '模型正在通读这段会话，稍等…'
                : '这个会话还没有总结。点「立即总结」，让模型把整段对话里的关键信息提炼出来。'}
            </div>
          )
        : (
            <div className="dws-list">
              {latestFirst.map((entry, index) => (
                <EntryCard entry={entry} index={index} key={`${entry.round}-${entry.at}`} />
              ))}
            </div>
          )}

      <div className="dws-foot">
        总结由会话所用的模型生成，可能不完整；只保存在这台电脑的浏览器本地。
      </div>
    </div>
  )
}
