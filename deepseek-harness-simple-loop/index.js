// 静态 import 失败时本模块尚未执行，请查看宿主的 failed to import 日志。
import { Service } from '@deepseek-ai/cordis'
import { appendFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SessionPreparation, interruptedTurnClosers } from '@deepseek-ai/dsh-session'
import { SimpleAgent, normalizeMode, modeBanner } from './agent.js'

const LOG_DIR = fileURLToPath(new URL('./logs/', import.meta.url))
export function trace(line) {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(`${LOG_DIR}/boot.log`, `${new Date().toISOString()} ${line}\n`)
  } catch { /* 日志失败不影响插件。 */ }
}

export const name = 'dwh-simple-loop'

export class SimpleLoop extends Service {
  static inject = ['agents', 'sessions']

  constructor(ctx, config = {}) {
    super(ctx, 'agentLoop')
    // 普通 holder 避免调用方的 Cordis shadow 重新追踪工厂依赖。
    const runtime = this.runtime = {
      ctx, abort: new AbortController(), pending: new Set(), handles: new Set(),
      mode: { value: normalizeMode(config.mode) ?? 'echo' },
    }
    this.maxSteps = 1
    ctx.effect(() => async () => {
      runtime.abort.abort(new Error('simple loop disabled'))
      await Promise.allSettled([...runtime.pending])
      const results = await Promise.allSettled([...runtime.handles].map((handle) => handle.dispose()))
      const errors = results.filter((result) => result.status === 'rejected').map((result) => result.reason)
      if (errors.length) throw new AggregateError(errors, 'simple loop teardown failed')
      trace('loop disabled; agents disposed')
    }, 'simpleLoop.lifecycle()')
    ctx.effect(() => ctx.agents.setFactory(this), 'simpleLoop.setFactory()')
    trace(`factory registered · mode=${runtime.mode.value}`)
    ctx.logger?.info?.(`[dwh-simple-loop] 已接管 agentLoop：${modeBanner(runtime.mode.value)}`)
  }

  createAgent(ownerCtx, options) { return this.start(ownerCtx, options, false) }
  resume(ownerCtx, options) { return this.start(ownerCtx, options, true) }

  start(ownerCtx, options, resume) {
    const runtime = this.runtime
    const ownerAbort = new AbortController()
    const signal = AbortSignal.any([
      runtime.abort.signal, ownerAbort.signal, ...(options.signal ? [options.signal] : []),
    ])
    ownerCtx.fiber.assertActive()
    signal.throwIfAborted()
    let handle
    let job
    const unfollowOwner = ownerCtx.effect(() => async () => {
      ownerAbort.abort(new Error('agent owner disposed'))
      await job?.catch(() => {})
      await handle?.dispose()
    }, 'simpleLoop.owner()')
    job = (async () => {
      let stored
      let preparation
      try {
        const ctx = runtime.ctx
        const persistence = ctx.get('sessionPersistence')
        const id = resume ? options.resumeSessionId : options.sessionId
        let storedCount = 0
        if (resume) {
          if (!persistence) throw new Error('cannot resume: session persistence is not configured')
          stored = await persistence.open(id, 'write', { signal })
          const cold = await stored.read(0, undefined, { signal })
          signal.throwIfAborted()
          const closers = interruptedTurnClosers(cold.events)
          if (closers.length) await stored.append(closers, { signal })
          storedCount = cold.events.length + closers.length
          preparation = SessionPreparation.create(ctx.sessions.prepare(id, {
            seed: [...cold.events, ...closers], meta: structuredClone(stored.header),
            inheritedEventCount: stored.inheritedEventCount, eventState: cold.eventState,
          }))
        } else {
          preparation = SessionPreparation.create(ctx.sessions.prepare(id, {
            ...(options.seed === undefined ? {} : { seed: options.seed }),
            ...(options.meta === undefined ? {} : { meta: options.meta }),
            ...(options.inheritedEventCount === undefined ? {} : { inheritedEventCount: options.inheritedEventCount }),
          }))
          stored = await persistence?.create(preparation.session.header, {
            inheritedEventCount: preparation.session.inheritedEventCount, signal,
          })
        }
        signal.throwIfAborted()
        handle = await this.publish(ownerCtx, id, preparation.session, options,
          resume ? 'resume' : 'startup', signal, stored, storedCount)
        stored = undefined // 写句柄由 agent 生命周期持有到停用或会话释放。
        return handle
      } finally {
        preparation?.[Symbol.dispose]?.()
        await stored?.close()
      }
    })()
    runtime.pending.add(job)
    const finish = () => runtime.pending.delete(job)
    job.then(finish, finish)
    return job.then((created) => ({
      agent: created.agent,
      dispose: async () => { await created.dispose(); await unfollowOwner() },
    }), async (error) => { await unfollowOwner(); throw error })
  }

  async publish(ownerCtx, id, session, options, source, signal, stored, storedCount) {
    const runtime = this.runtime
    const ctx = runtime.ctx
    const agent = new SimpleAgent(ctx, id, options.agentOptions ?? {}, session, runtime.mode)
    let detachSession
    let detachAgent
    let disposing
    let unfollowScope
    const handle = {
      agent,
      dispose: () => disposing ??= (async () => {
        agent.cancel({ kind: 'disposed' })
        try { await agent.whenIdle() }
        finally {
          try { await agent.scope.dispose() }
          finally {
            try { await stored?.close() }
            finally {
              detachAgent?.()
              detachSession?.()
              runtime.handles.delete(handle)
            }
          }
        }
      })(),
    }
    runtime.handles.add(handle)
    try {
      unfollowScope = ctx.effect(function* () {
        yield agent.scope.rawDispose
        yield () => handle.dispose()
      }, `simpleLoop.scope(${id})`)
      signal.throwIfAborted()
      const commit = await options.setup?.(agent.ctx, agent)
      signal.throwIfAborted()
      ownerCtx.fiber.assertActive()
      commit?.commit?.()
      const suffix = session.snapshotEvents(storedCount)
      if (suffix.length) await stored?.append(suffix, { signal })
      signal.throwIfAborted()
      detachSession = agent.ctx.sessions.enter(session)
      detachAgent = ctx.agents.enter(agent, options.parentAgent)
      agent.ctx.sessions.announce(session)
      await ctx.agents.announce(agent, source, signal)
      signal.throwIfAborted()
      trace(`published agent ${id} (${source})`)
    } catch (error) {
      await handle.dispose()
      await unfollowScope?.()
      trace(`publish failed: ${error?.stack ?? error}`)
      throw error
    }
    return handle
  }
}

export default SimpleLoop
