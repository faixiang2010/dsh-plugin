/**
 * deepseek-harness-login — Host 端插件
 *
 * 目标：让 DSH 桌面版使用自有账户体系登录，不依赖 DeepSeek 的 OAuth。
 *
 * 实现原理（全部基于 DSH 现有公开机制，不修改 DSH 源码）：
 *
 * 1. `deepseek-account` 插件保持启用 —— Desktop Host 启动时硬依赖
 *    `ctx.inject(['deepseekAccount'])`，禁用它会让 Host 永不就绪。
 *
 * 2. 拦截 `deepseekAccount.startSignIn()`。登录按钮（Desktop Welcome 页）
 *    最终走的是 AccountController 的 `startSignIn` RPC → 该方法。
 *
 * 3. 返回的 attempt 处于 `waiting-browser` 且 `authorizeUrl` 指向本插件注册的
 *    本地页面（`http://127.0.0.1:<port>/custom-login`）。Desktop 会用系统
 *    浏览器打开它（main.ts 的 shell.openExternal），并校验目标必须是
 *    HTTPS 或 HTTP loopback —— 本地地址正好合法。
 *
 * 4. 页面提交用户名密码 → 本插件校验 → 写入 `deepseek-account-platform/default`
 *    的 grant 记录 → `credentials/record-updated` 触发 account 的 changed()
 *    → Desktop 的 watch 收到 `status: 'credential-stored'` 且
 *    `attempt.phase: 'succeeded'`，自动进入工作区。
 */

import { randomUUID } from 'node:crypto'
import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { renderAccountPage, renderLoginPage } from './login-page.js'

const PLUGIN = 'deepseek-harness-login'

/** deepseek-account 读取的凭证记录 key（PlatformAccount 的 Service.init 会校验 issuer）。 */
const ACCOUNT_KEY = 'deepseek-account-platform/default'

const LOGIN_PATH = '/custom-login'
const SUBMIT_PATH = '/custom-login/submit'
const DIAG_PATH = '/custom-login/diag'
const ACCOUNT_PATH = '/custom-login/account'

/** 账户设置页身份行副标题：替换 UI 默认的"账号资料暂不可用"。 */
const ACCOUNT_SUBTITLE = '本地账户 · 内网部署'

/** 首屏加载页（boot page）的品牌文案，替换硬编码的 "HARNESS"。 */
const BOOT_BRAND_TEXT = '大伟的智能体'

/**
 * 加载页品牌替换样式。
 *
 * boot page 由 `@deepseek-ai/dsh-client-web` 在插件加载完成前渲染，
 * 文案是硬编码的；这里用 CSS 把原文字缩成 0、再用伪元素显示自己的品牌，
 * 因此无需等任何脚本执行，首屏第一帧就是新文案。
 *
 * 选择器：主选择器依赖 CSS Modules 保留的 local 名；结构选择器是兜底——
 * boot page 的 DOM 固定为 `[data-dsh-boot] > card > wordmark`（见 boot-page.ts），
 * 即使类名被压成纯哈希也能命中。颜色沿用 boot page 自己的变量链，
 * 浅色 / 深色主题都能正确显示。
 */
const BOOT_BRAND_SELECTORS = [
  '[data-dsh-boot] [class*="wordmark"]',
  '[data-dsh-boot] > div > div:first-child',
]

const BOOT_BRAND_CSS = BOOT_BRAND_SELECTORS
  .map((selector) => [
    selector + ' { font-size: 0 !important; letter-spacing: 0 !important; }',
    selector + '::after {',
    "  content: '" + BOOT_BRAND_TEXT + "';",
    '  display: inline-block;',
    '  font-size: 18px;',
    '  line-height: 24px;',
    '  font-weight: 600;',
    '  letter-spacing: 0.08em;',
    '  color: var(--dsw-alias-label-primary, var(--dsh-boot-brand, #0f1115));',
    '}',
  ].join('\n'))
  .join('\n')

/** 一次登录尝试的有效期。 */
const ATTEMPT_TTL_MS = 10 * 60 * 1000
/** 提交体上限，凭据表单只需要几十字节。 */
const MAX_BODY_BYTES = 4096

/** 本地签发 token 的前缀，用来区分平台凭证。 */
const LOCAL_TOKEN_PREFIX = 'dsh-local-'

/** 本地账户表：只有这里列出的用户名/密码可以登录。 */
const ACCOUNTS = new Map([['dawei', '123456']])

export const name = PLUGIN
export const inject = ['credentials', 'webServer', 'deepseekAccount']

export function apply(ctx) {
  const account = ctx.deepseekAccount
  const credentials = ctx.credentials
  const webServer = ctx.webServer

  /** 当前登录尝试；undefined 表示没有进行中的自定义登录。 */
  let attempt
  /** 当前登录的本地账户（profile 展示用）。 */
  let signedInUser
  /** 本次会话的登录时间，仅用于账户页展示。 */
  let signedInAt
  /** 最近一次失败原因，供诊断端点读取。 */
  let lastError = ''

  const logDir = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'logs')
  const logFile = join(logDir, PLUGIN + '.log')

  const fileLog = (level, message) => {
    try {
      mkdirSync(logDir, { recursive: true })
      appendFileSync(logFile, new Date().toISOString() + ' [' + level + '] ' + message + '\n')
    } catch {
      // 日志写入失败不能影响登录流程
    }
  }

  const log = (message) => {
    try {
      ctx.logger.info('[' + PLUGIN + '] ' + message)
    } catch {
      // 日志失败不能影响登录流程
    }
    fileLog('info', message)
  }

  const fail = (message) => {
    lastError = message
    fileLog('error', message)
    try {
      ctx.logger.error('[' + PLUGIN + '] ' + message)
    } catch {
      // ignore
    }
  }

  const notify = () => {
    try {
      account.changed()
    } catch (error) {
      log('唤醒账户监听失败：' + String(error))
    }
  }

  // ─────────────────────────── HTTP 路由 ───────────────────────────

  const servePage = (req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' }).end('Method Not Allowed')
      return
    }
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    const id = url.searchParams.get('a') ?? ''
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    })
    res.end(renderLoginPage(id))
  }

  const serveSubmit = async (req, res) => {
    const send = (code, payload) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(payload))
    }
    if (req.method !== 'POST') return send(405, { ok: false, error: '方法不允许' })

    let raw = ''
    for await (const chunk of req) {
      raw += chunk
      if (raw.length > MAX_BODY_BYTES) return send(413, { ok: false, error: '请求过大' })
    }

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return send(400, { ok: false, error: '请求格式错误' })
    }
    if (typeof payload !== 'object' || payload === null) return send(400, { ok: false, error: '请求格式错误' })

    log('收到登录提交：username=' + String(payload.username ?? '') + ' attempt=' + String(payload.attempt ?? ''))

    if (attempt === undefined || attempt.phase !== 'waiting-browser' || payload.attempt !== attempt.id) {
      fail('提交与会话不匹配：当前 attempt=' + JSON.stringify(attempt ?? null))
      return send(409, { ok: false, error: '登录会话已失效，请回到 DSH 重新发起登录' })
    }
    if (Date.now() > attempt.expiresAt) {
      attempt = { id: attempt.id, phase: 'expired' }
      notify()
      return send(410, { ok: false, error: '登录已超时，请重新发起登录' })
    }

    const username = String(payload.username ?? '').trim()
    const password = String(payload.password ?? '')
    const expected = ACCOUNTS.get(username)

    if (expected === undefined || expected !== password) {
      log('登录失败：用户名或密码错误（' + username + '）')
      return send(401, { ok: false, error: '用户名或密码错误' })
    }

    try {
      // 先落成功态，再写凭证：写记录会同步唤醒 watch，此刻 phase 必须已经是 succeeded。
      attempt = { id: attempt.id, phase: 'succeeded' }
      signedInUser = { id: 'local-' + username, name: username }
      signedInAt = new Date()
      await writeGrant(credentials, account, username)
      notify()
      log('登录成功：' + username)
    } catch (error) {
      attempt = { id: attempt.id, phase: 'failed' }
      notify()
      const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
      fail('写入凭证失败：' + detail)
      return send(500, { ok: false, error: '本地凭证写入失败：' + (error?.message ?? String(error)) })
    }

    return send(200, { ok: true })
  }

  /** 诊断端点：确认路由可用、凭证是否真的落盘。 */
  const serveDiag = async (req, res) => {
    const send = (code, payload) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(payload, null, 2))
    }
    if (req.method !== 'GET') return send(405, { ok: false })
    const info = { plugin: PLUGIN, attempt: attempt ?? null, lastError, store: null, state: null }
    try {
      const record = await credentials.readRecord(ACCOUNT_KEY)
      info.store = record === undefined ? 'absent' : JSON.stringify(record)
    } catch (error) {
      info.store = 'read-failed: ' + String(error)
    }
    try {
      info.state = await account.getState()
    } catch (error) {
      info.state = 'getState-failed: ' + String(error)
    }
    return send(200, info)
  }

  /** 账户信息页：接管设置页里指向 Platform 的三个入口。 */
  const serveAccountPage = async (req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405).end()
      return
    }
    const signedIn = await isLocalGrant()
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    })
    res.end(renderAccountPage(signedIn
      ? {
        name: signedInUser?.name,
        method: '本地账户（用户名 + 密码）',
        since: signedInAt === undefined ? '—' : signedInAt.toLocaleString('zh-CN'),
      }
      : { name: '未登录', method: '—', since: '—' }))
  }

  ctx.effect(
    () => webServer.register({ kind: 'exact', path: LOGIN_PATH, handler: servePage }),
    PLUGIN + ': login page route',
  )
  ctx.effect(
    () => webServer.register({ kind: 'exact', path: SUBMIT_PATH, handler: serveSubmit }),
    PLUGIN + ': login submit route',
  )
  ctx.effect(
    () => webServer.register({ kind: 'exact', path: ACCOUNT_PATH, handler: serveAccountPage }),
    PLUGIN + ': account page route',
  )
  ctx.effect(
    () => webServer.register({ kind: 'exact', path: DIAG_PATH, handler: serveDiag }),
    PLUGIN + ': diagnostics route',
  )

  // 首屏加载页的品牌文案：把样式行注入 index.html 的 <head>。
  ctx.effect(
    () => ctx.on('webserver/index-inject', (table) => {
      table.push({ kind: 'style', text: BOOT_BRAND_CSS })
    }),
    PLUGIN + ': boot page brand',
  )

  // ───────────────────────── 账户服务替换 ─────────────────────────

  const rawGetState = account.getState.bind(account)
  const rawCancelSignIn = account.cancelSignIn.bind(account)
  const rawSignOut = account.signOut.bind(account)

  /** 本地账户页地址；webServer 尚未监听时返回 undefined。 */
  const localBase = () => {
    try {
      return loginOrigin(webServer)
    } catch {
      return undefined
    }
  }

  // getState 必须对外暴露我们自己的 attempt，否则 Desktop 看不到 authorizeUrl，
  // 也不会在成功后识别到 succeeded 而进入工作区。同时把 Platform 链接换成
  // 我们自己的账户页，避免界面把用户带回 platform.deepseek.com。
  account.getState = async function patchedGetState(...args) {
    const state = await rawGetState(...args)
    const base = (await isLocalGrant()) ? localBase() : undefined
    const links = base === undefined
      ? state.links
      : { usageUrl: base + ACCOUNT_PATH, topUpUrl: base + ACCOUNT_PATH }
    if (attempt === undefined) return base === undefined ? state : { ...state, links }
    const view = { id: attempt.id, phase: attempt.phase }
    if (attempt.authorizeUrl !== undefined) view.authorizeUrl = attempt.authorizeUrl
    if (attempt.expiresAt !== undefined) view.expiresAt = attempt.expiresAt
    return { ...state, links, attempt: view }
  }

  account.startSignIn = async function patchedStartSignIn() {
    const id = randomUUID()
    attempt = {
      id,
      phase: 'waiting-browser',
      authorizeUrl: loginOrigin(webServer) + LOGIN_PATH + '?a=' + encodeURIComponent(id),
      expiresAt: Date.now() + ATTEMPT_TTL_MS,
    }
    log('已拦截登录请求，自定义登录入口：' + attempt.authorizeUrl)
    notify()
    return account.getState()
  }

  account.cancelSignIn = async function patchedCancelSignIn(id) {
    if (attempt !== undefined && attempt.id === id) {
      attempt = { id: attempt.id, phase: 'cancelled' }
      notify()
      log('登录已取消')
      return account.getState()
    }
    return rawCancelSignIn(id)
  }

  account.signOut = async function patchedSignOut(client) {
    attempt = undefined
    signedInUser = undefined
    return rawSignOut(client)
  }

  // ───────────────── 离线化：短路所有平台网络请求 ─────────────────
  //
  // PlatformAccount 在 getDetail/readAccountDetail 收到 401 时会调用
  // expireCredential()，直接删掉本地 grant。本地签发的 token 在真实的
  // platform.deepseek.com 上必然 401，凭证会在登录成功后被立刻清掉。
  // 离线部署也没有平台可连，因此这里把这些入口全部短路。

  const rawGetProfile = account.getProfile.bind(account)
  const rawGetBalance = account.getBalance.bind(account)
  const rawGetUnnotifiedBonuses = account.getUnnotifiedBonuses.bind(account)
  const rawAckBonusNotified = account.ackBonusNotified.bind(account)
  const rawRejectToken = account.rejectToken.bind(account)

  /** 当前记录是否由本插件签发；顺带从记录里恢复用户名（重启后也能显示）。 */
  const isLocalGrant = async () => {
    if (signedInUser !== undefined) return true
    try {
      const record = await credentials.readRecord(ACCOUNT_KEY)
      if (record?.kind !== 'grant') return false
      signedInUser = parseLocalUser(record.payload?.token)
      return signedInUser !== undefined
    } catch {
      return false
    }
  }

  account.getProfile = async function patchedGetProfile(client) {
    if (!(await isLocalGrant())) return rawGetProfile(client)
    return {
      status: 'ready',
      value: {
        id: signedInUser?.id ?? 'local-user',
        name: signedInUser?.name ?? null,
        // UI 用 contact 作为身份行副标题，null 会显示"账号资料暂不可用"。
        contact: ACCOUNT_SUBTITLE,
      },
    }
  }

  account.getBalance = async function patchedGetBalance(client) {
    if (!(await isLocalGrant())) return rawGetBalance(client)
    // 返回合法的空钱包：null 会让界面一直停在"加载中"。
    return { status: 'ready', value: [], bonusWallets: [] }
  }

  account.getUnnotifiedBonuses = async function patchedGetUnnotifiedBonuses(client) {
    if (!(await isLocalGrant())) return rawGetUnnotifiedBonuses(client)
    return null
  }

  account.ackBonusNotified = async function patchedAckBonusNotified(...args) {
    if (!(await isLocalGrant())) return rawAckBonusNotified(...args)
    return false
  }

  // 最关键的一条：模型请求收到 401 时，上层会调用 rejectToken 触发凭证删除。
  // 本地账户不存在平台侧 token，这条路径必须屏蔽，否则一用模型就掉登录。
  account.rejectToken = async function patchedRejectToken(token) {
    if (await isLocalGrant()) {
      log('已忽略平台拒绝本地凭证的请求（token=' + String(token).slice(0, 12) + '…）')
      return
    }
    return rawRejectToken(token)
  }

  log('已就绪：登录将走本地账户校验（本地登录页 ' + LOGIN_PATH + '）')
}

/**
 * 计算交给 Desktop 的本地登录页 origin。
 *
 * Desktop 只允许 HTTPS 或 HTTP loopback 作为浏览器跳转目标（见 account-backend.ts
 * 的 validateBrowserDestination），所以这里始终产出 loopback 地址。
 */
function loginOrigin(webServer) {
  try {
    const url = new URL(webServer.getOrigin())
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return url.origin
    const port = webServer.port
    if (typeof port === 'number') return 'http://127.0.0.1:' + port
    return url.origin
  } catch (error) {
    throw new Error('deepseek-harness-login: 无法确定本地 Web 服务地址：' + String(error))
  }
}

/**
 * 解析写入 grant 时应使用的 issuer。
 *
 * 必须是 PlatformAccount 自己的 origin：它的 Service.init() 在每次启动时比较
 * `payload.issuer === origin`，不一致就把这条记录删掉。
 *
 * 不要用 `getState().links` 推导 —— 本插件已经把 links 换成了本地账户页，
 * 取到的会是 `http://127.0.0.1:<port>`，结果就是每次重启都掉登录。
 */
function resolveIssuer(account) {
  const origin = account?.origin
  if (typeof origin === 'string' && origin.length > 0) return origin
  // PlatformAccount 的默认 platformOrigin。
  return 'https://platform.deepseek.com'
}

/**
 * 写入 deepseek-account 读取的 grant 记录。
 */
async function writeGrant(credentials, account, username) {
  const issuer = resolveIssuer(account)

  const record = {
    kind: 'grant',
    payload: {
      version: 1,
      // 用户名用 base64url 编码：用户名和 UUID 都含连字符，直接拼接无法还原。
      token: LOCAL_TOKEN_PREFIX + Buffer.from(username, 'utf8').toString('base64url') + '.' + randomUUID(),
      issuer,
    },
  }
  await credentials.modifyRecord(ACCOUNT_KEY, () => Promise.resolve(record))
}

/**
 * 从本地 token 还原用户名。
 *
 * 当前格式：`dsh-local-<base64url(username)>.<uuid>`。
 * 兼容早期格式：`dsh-local-<username>-<uuid>`（UUID 本身带连字符，只剥离末尾 UUID）。
 */
function parseLocalUser(token) {
  if (typeof token !== 'string' || !token.startsWith(LOCAL_TOKEN_PREFIX)) return undefined
  const rest = token.slice(LOCAL_TOKEN_PREFIX.length)
  let name
  const dot = rest.indexOf('.')
  if (dot > 0) {
    try {
      name = Buffer.from(rest.slice(0, dot), 'base64url').toString('utf8')
    } catch {
      return undefined
    }
  } else {
    const legacy = /^(.*)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.exec(rest)
    name = legacy ? legacy[1] : rest
  }
  if (typeof name !== 'string' || name.length === 0) return undefined
  return { id: 'local-' + name, name }
}
