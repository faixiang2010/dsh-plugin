# deepseek-harness-login

把 DSH 桌面版的登录换成**自己的用户名 + 密码**，不依赖 DeepSeek 账号体系，适用于内网 / 离线部署。

- 保留 `deepseek-account` 插件（Desktop 启动依赖它，禁用会直接崩溃）
- 登录入口换成自己的登录页，登录后账户信息全部由本插件接管
- 界面不再出现 DeepSeek 平台入口；加载页品牌改为「大伟的智能体」

> 它改的是**行为**（登录、账户数据），不是品牌。名称 / logo / 关于弹窗这类改动
> 属于 Electron 外壳，插件做不到，见 [docs/品牌定制方案选型.md](docs/品牌定制方案选型.md)。

---

## 能做什么 / 不能做什么

| | 内容 |
|---|---|
| 能做 | 拦截登录、本地校验用户名密码、写本地凭证、接管账户资料与余额、隐藏平台入口、改加载页品牌 |
| 不能做 | 原生菜单 / 关于弹窗 / 窗口标题 / 托盘 / 安装包与图标（这些在主进程和打包层） |

---

## 目录结构

```
deepseek-harness-login/
├── package.json          # bundle patch 声明 + client 声明
├── cordis.patch.yml      # 把自己 insert 进 Cordis 组合（必需，不能为空）
├── lib/
│   ├── index.js          # Host：拦截登录、校验凭据、写凭证、接管账户数据
│   ├── login-page.js     # 登录页 + 账户信息页（自包含 HTML）
│   └── client.js         # Client：隐藏设置页里的 Platform 入口
└── docs/
```

`lib/` 是可直接加载的成品，无需构建、无第三方依赖。

---

## 工作原理（4 步）

登录按钮最终走 `deepseekAccount.startSignIn()`。本插件替换它的输出：

| 步骤 | 发生什么 |
|---|---|
| 1 | `startSignIn` 被替换，返回 `phase: 'waiting-browser'` + 本地 `authorizeUrl` |
| 2 | Desktop 校验地址（必须是 HTTPS 或 HTTP loopback）后用系统浏览器打开 |
| 3 | 页面提交用户名密码 → Host 校验 → 写入 `deepseek-account-platform/default` 凭证 |
| 4 | `getState()` 返回 `credential-stored` + `succeeded`，Desktop 自动进入工作区 |

配套的两件事：

- **短路平台请求**：本地 token 在真实平台必然 401，而 401 会触发删凭证。
  因此接管 `getProfile` / `getBalance` / `getUnnotifiedBonuses` / `ackBonusNotified`，
  并把 `rejectToken` 变成空操作。
- **隐藏平台入口**：设置页里硬编码的「更多账号信息 / 查询用量 / 充值」等链接，
  由 `lib/client.js` 注入样式隐藏（`[class*="accountInfo"]`、`[class*="balanceCard"]`）。

详细链路与实现见 [docs/实现方案与踩坑沉淀.md](docs/实现方案与踩坑沉淀.md)。

---

## 安装

**方式一：插件市场**（推荐）

侧栏 → 插件市场 → 安装本地包 → 选择 `D:\electron\deepseek-harness-login`。

**方式二：手动写 profile**

编辑 `C:\Users\<用户名>\.dsh\profiles\desktop\package.json`：

```json
{
  "dependencies": { "deepseek-harness-login": "link:D:/electron/deepseek-harness-login" },
  "dsh": { "profile": { "bundles": ["deepseek-harness-login"] } }
}
```

```powershell
cd "$env:USERPROFILE\.dsh\profiles\desktop"
node "D:\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.cjs" install --no-frozen-lockfile
```

> 必须用 **DSH 自带的 pnpm**。用系统 pnpm（10.x）会把 profile 锁到 `store\v10`，
> 之后插件市场装任何插件都报 `ERR_PNPM_UNEXPECTED_STORE`（详见坑 13）。

改完**完全退出并重启** DSH。

---

## 使用

| 用户名 | 密码 |
|---|---|
| `dawei` | `123456` |

1. 完全退出 DSH（任务管理器确认 `DeepSeek Harness.exe` 全部结束）
2. 启动 DSH，在欢迎页点登录
3. 浏览器打开登录页，输入 `dawei` / `123456`
4. 显示 `ACCESS GRANTED`，回到 DSH 自动进入工作区

重启沿用已写入的凭证，无需重复登录。

- **改凭据**：`lib/index.js` 里的 `const ACCOUNTS = new Map([['dawei', '123456']])`，改完重启。
- **对接真实后端**：把 `serveSubmit` 的本地校验换成 HTTP 调用，并把真实 token 写进
  `writeGrant()`；此时要同时移除 `rejectToken` 的短路。
- **账户信息页**：设置页入口已指向 `http://127.0.0.1:<port>/custom-login/account`。

---

## 排查

```powershell
# 日志
Get-Content "$env:USERPROFILE\.dsh\logs\deepseek-harness-login.log" -Tail 50
# 诊断端点（DSH 运行时访问）
http://127.0.0.1:<port>/custom-login/diag
```

| 现象 | 先查 |
|---|---|
| 插件市场显示「异常」 | `cordis.patch.yml` 顶层必须是 `- insert: [...]`，不能是空数组 |
| 点登录仍跳 `platform.deepseek.com` | 插件没真正加载：看日志里有没有「已拦截登录请求」 |
| 登录页打不开 / 报 invalid destination | `authorizeUrl` 必须是 `http://127.0.0.1:*` |
| 登录成功又掉登录 | `rejectToken` 短路是否生效；凭证是否被 401 清掉 |
| 余额一直「加载中…」 | `getBalance` 是否返回结构合法的空钱包 |
| 界面仍有 DeepSeek 入口 | Client 端未加载：检查 `dsh.client` 与 `./client` export |
| 改了代码不生效 | `cordis.patch.yml` / `package.json` / Host 代码要重启，Client 只需刷新 |

更多坑（含 cookie 损坏、issuer 丢失登录态等）见 [docs/实现方案与踩坑沉淀.md](docs/实现方案与踩坑沉淀.md#4-踩坑)。

---

## 已知限制

- 模型调用仍指向 DeepSeek 接口，内网部署需另配本地 / 内网模型端点。
- 凭据硬编码在源码里，适合内网快速验证；正式交付建议对接后端鉴权接口。
- 品牌类改动（名称 / logo / 关于弹窗）不在插件能力范围，见
  [docs/品牌定制方案选型.md](docs/品牌定制方案选型.md)。

---

## 文档

| 文档 | 内容 |
|---|---|
| [实现方案与踩坑沉淀.md](docs/实现方案与踩坑沉淀.md) | 账户链路、实现细节、15 个坑与排错 |
| [品牌定制方案选型.md](docs/品牌定制方案选型.md) | 换名称 / logo 该改源码还是做插件 |

---

## 版本历史

| 版本 | 说明 |
|---|---|
| v0.4.4 | 修复重启后掉登录（issuer 不再经被 patch 的 `getState`） |
| v0.4.3 | 加载页品牌改为「大伟的智能体」 |
| v0.4.2 | 修复账户名解析；隐藏 Platform 入口；新增本地账户页 |
| v0.4.1 | 短路平台请求，修复登录后凭证被 401 清除 |
| v0.4.0 | 改为拦截 `startSignIn` + 本地登录页方案 |
| v0.1.0 | 早期抢占 flow 方案（已废弃，会破坏 Desktop 启动） |

---

## 停用 / 卸载

从 profile 的 `dsh.profile.bundles` 移除 `"deepseek-harness-login"`，用 DSH 自带 pnpm
跑一次 `install --no-frozen-lockfile`，重启 DSH。

登录状态仍在 `~/.dsh/.credentials.yaml` 的 `deepseek-account-platform/default`；
要彻底恢复官方登录，删掉该条记录再重新登录即可。

---

## License

MIT
