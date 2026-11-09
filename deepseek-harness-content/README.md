# 大伟总结 — DeepSeek Harness 会话总结插件

一个**独立于 DSH 仓库**的插件：在会话视图标签条（对话 / 轨迹 / 上下文 … 那一排）末尾加一个「大伟总结」标签，用会话自己的模型把整段对话提炼成关键信息，并把每次结果存在本机。

- 每完成一轮对话，自动让模型通读整段会话，输出「我的诉求 / 关键结论 / 待办与未决」三段要点
- 也可以随时点「立即总结」重跑一次，或关掉自动总结
- 总结按轮次留档，只存浏览器 `localStorage`，不上传、不写会话日志
- 不改变任何 DSH 内置行为，停用插件后标签立即消失

## 目录结构

```
deepseek-harness-content/
├── package.json          # bundle 声明（dsh.bundle.patch）+ client 声明（dsh.client）
├── cordis.patch.yml      # bundle 补丁层：向 profile 组合里插入一行插件，附带可选 config
├── tsdown.config.ts      # 双端构建：host 走 ESM，browser 打成 ModuleLoader 工厂
├── src/
│   ├── shared.ts         # 双端共用的路由地址与请求/响应类型
│   ├── index.ts          # Host 半边：注册 /api/dawei-summary/summarize 并调用 ctx.llm
│   └── client/
│       ├── index.tsx     # Browser 半边入口：注册 conversation.view 标签
│       ├── transcript.ts # 从会话事件窗口还原「我说的话 + 助手回复」
│       ├── controller.ts # 每会话控制器：判轮次、防抖、请求宿主、落库
│       ├── storage.ts    # localStorage 读写（v2 结构、最多 30 条）
│       ├── DaweiSummaryView.tsx  # 面板：三段要点 + 历史轮次
│       └── styles.ts     # 面板样式（运行时注入 <style>）
└── lib/                  # 构建产物：index.js（host）/ client.js（browser）
```

## 它是怎么接进去的

全部使用 DSH 的正规扩展点，没有改动 `deepseek-harness` 任何源码：

| 目标 | 用到的扩展点 |
|---|---|
| 在标签条加一个入口 | `ctx.slots.inject('conversation.view', …)` + `ctx.slots.register({ name: 'conversation.view', id, order, label, inject }, View)`，`order: 100` 排在「编队」等内置标签之后 |
| 读会话内容 | `ctx.sessions.binding(sessionId).eventSource`：与「对话」视图同一个事件窗口，筛出 `user/message`（`source.kind === 'user'`）和落定的 `assistant/message` |
| 浏览器调用宿主 | `ctx.connection.fetch.register({ path: '/api/dawei-summary/summarize', methods: ['POST'], requestBody: 'buffered', fetch })`，浏览器端用相对地址 `api/dawei-summary/summarize`，沿用当前 Host 的鉴权与同源校验 |
| 调模型 | Host 侧的 `ctx.llm.prepareCall({ provider, model, maxTokens })` + `call.stream({ system, messages })`，与「会话标题生成」走同一条模型通路 |
| 免配置选路 | 未配置 provider/model 时用 `ctx.llm.listProviders()` / `listModels()` 取第一个可用组合 |

数据流：

```
会话事件窗口 ──筛选/拼装──▶ transcript（【我】/【助手】）
      │                              │
      │ 新轮次完成（静置 2s）        │ POST /api/dawei-summary/summarize
      ▼                              ▼
controller 防抖 ──────────────▶ Host: ctx.llm.stream(...)
      │                              │
      └──── Markdown 要点 ◀──── 200 { ok, summary, provider, model }
                     │
                     ▼
            localStorage（按 sessionId 分桶）
```

## 安装

### 方式一：Web 插件页（推荐）

侧栏 → **Plugins** → 安装 / 添加本地包 → 选择本目录：

```
D:\electron\deepseek-harness-content
```

插件管理器会把它加入当前 profile 依赖并启用 bundle。

### 方式二：手动写 profile

编辑 `$DSH_HOME/profiles/<profile>/package.json`（Windows 默认 `C:\Users\<你>\.dsh\profiles\<profile>`）：

```json
{
  "dependencies": {
    "deepseek-harness-content": "link:D:/electron/deepseek-harness-content"
  },
  "dsh": {
    "profile": {
      "bundles": ["deepseek-harness-content"]
    }
  }
}
```

在 profile 目录执行 `pnpm install`（或在 `node_modules` 下建一个指向本目录的 Junction），重启 DSH。

### 方式三：已有 profile 直接挂行

包已能被 profile 解析时，也可以只在 profile 的 `cordis.patch.yml` 里插入：

```yaml
- insert:
    - id: deepseek-harness-content
      name: deepseek-harness-content
```

### 开发构建

```bash
pnpm install
pnpm build      # 产出 lib/index.js 与 lib/client.js
pnpm typecheck
```

Host 半边改动需要重启 DSH；Browser 半边（`lib/client.js`）刷新页面即可。

## 配置

在 `cordis.patch.yml` 的 `config`（或 profile 补丁层）里可选项：

```yaml
- id: deepseek-harness-content
  name: deepseek-harness-content
  config:
    provider: deepseek-official   # 与 model 必须成对出现
    model: deepseek-flash
    maxOutputTokens: 800          # 默认 800
    timeoutMs: 90000              # 默认 90s
    maxInputChars: 16000          # 默认 16000，超出保留最近内容
```

不写 `provider` / `model` 时自动使用宿主已注册的第一个 provider 及其第一个模型。

## 使用

1. 打开任意会话，点标签条里的「大伟总结」。
2. 首次进入会自动生成一条（覆盖当前全部对话）；之后每完成一轮就自动追加。
3. 顶部按钮：
   - **立即总结 / 重新总结**：立刻用当前整段会话重跑一次
   - **清空**：删掉这个会话的全部历史
   - **每轮结束后自动总结**：关掉后只在你点按钮时才调用模型
4. 每条结果按「第 N 轮 + 时间」归档，最新一条默认展开，其余可逐条展开；底部显示实际使用的 provider / model。

## 数据与隐私

- 键名：`dsh.dawei-summary.v2:<sessionId>`，值含 `auto`、`entries[{ round, at, summary, provider, model }]`。
- 只存在这台电脑的浏览器本地；换浏览器、清站点数据会一起消失。
- 会话原文只在本机拼装，随请求发给**本机 Host**；Host 再把它作为一次普通模型请求发给当前配置的模型服务（与正常对话相同通路）。
- 不使用插件时删除该键即可彻底清除记录。

## 自定义

- **提示词**：`src/index.ts` 里的 `SYSTEM_PROMPT`，改完 `pnpm build` 并重启 DSH。
- **触发时机 / 防抖**：`src/client/controller.ts` 的 `SETTLE_MS`（默认 2000ms）。
- **历史条数**：`src/client/storage.ts` 的 `MAX_ENTRIES`（默认 30）。
- **样式**：`src/client/styles.ts`，类名统一 `dws-` 前缀；配色沿用 DSH 主题变量（如 `--dsw-alias-brand-primary`），深浅色自动跟随。

## 已知边界

- **只在标签打开时自动总结**：会话视图标签是「一次只渲染一个」的，控制器随视图挂载；关掉标签期间新增的轮次不会自动补，下次打开会合并成一条总结（只花一次调用）。
- **每次总结都是整段会话**：不做增量拼接，因此长会话的输入会被 `maxInputChars` 截断（保留最近部分，并在开头标注「前文已省略」）。
- **会消耗模型额度**：自动总结默认开启，每完成一轮触发一次；想省钱就关掉开关，改为手动点。
- **模型不返回正文时**报错提示，不写空记录；失败可用「立即总结」重试。
- **依赖宿主 `connection` 与 `llm` 服务**：任一缺失时插件不会加载（标签不出现），这是刻意的——没有模型通路就没有总结。
