# dsh-dashboard-wuhan

一个 DeepSeek Harness (DSH) 插件：在 DSH 左侧菜单注册 **"大伟的仪表盘"** 入口，点击后在主面板展示 **武汉城市介绍**。

## 特性

- 📌 **侧边栏菜单**：在 DSH 左侧导航栏添加一个仪表盘图标
- 🎛️ **可开关**：默认关闭，通过 DSH 插件管理面板启用后才会出现
- 📖 **武汉介绍**：基本信息、地理气候、历史沿革、文化美食、经济产业、交通出行
- 🌐 **中英文双语**：跟随 DSH 界面语言自动切换
- 🎨 **DSH 主题适配**：使用 `--dsw-*` CSS 变量，跟随 DSH 明暗主题

## 目录结构

```
deepseek-harness-dashboard/
├── package.json            # 插件元数据（dsh.bundle.patch 指向 cordis.patch.yml）
├── cordis.patch.yml        # DSH bundle 声明 —— 默认 disabled: true
├── tsconfig.json
├── tsdown.config.ts        # 同时构建 host (node) 和 client (browser) 两半
└── src/
    ├── index.ts            # Host 入口（空实现，所有 UI 在 client 侧）
    └── client/
        ├── index.tsx       # ★ 关键：apply() 注册 sidebar.panellist + main slot
        ├── WuhanDashboard.tsx   # 武汉介绍面板
        ├── locales.ts      # 中英文字典
        └── index.css       # 样式
```

## 工作原理

DSH 插件分两半：

| 半 | 入口 | 运行环境 | 作用 |
|---|---|---|---|
| Host | `src/index.ts` → `lib/index.js` | Node.js (DSH 后端) | 可做后端逻辑，本插件空实现 |
| Client | `src/client/index.tsx` → `lib/client.js` | 浏览器 (DSH WebView) | 通过 `ctx.slots.register` 向 DSH 的 Slot 系统注册 UI |

注册流程（核心只有 3 步）：

```ts
// 1. 注册主面板 —— 点击菜单后右侧显示的内容
ctx.slots.inject('main', () => ctx.slots.register(
  { name: 'main', key: PANEL_ID, locale: NS },
  () => <WuhanDashboard t={t} />,
))

// 2. 注册侧边栏菜单 —— 左侧出现图标+文字
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
  { name: 'sidebar.panellist', id: PANEL_ID, order: 50, label: () => t('panel') },
  DashboardIcon,
))
```

## 开关机制

`cordis.patch.yml` 里的 `disabled: false` 让插件默认启用；改成 `true`（或在插件管理面板里关闭）后，DSH 不再加载 `lib/index.js` 与 `lib/client.js`，侧边栏菜单随之消失。

## 构建

```bash
pnpm install
pnpm build
# 产物：lib/index.js + lib/client.js
```

## 安装到 DSH（推荐：DSH 图形界面本地路径安装）

DSH 插件管理面板（截图中的 **"+ 添加插件"** 对话框）**完全支持本地目录路径安装**。

### 第 1 步：确认 lib/ 存在（改过源码才需要重新构建）

DSH 加载插件时会解析 `package.json` 的 `"main": "lib/index.js"` 与 `"exports"`，
`lib/` 缺失会直接报 `ERR_MODULE_NOT_FOUND`。本仓库已把 `lib/` 产物纳入版本控制，
克隆后可直接安装；如果你改过 `src/`，再执行：

```bash
cd ./
pnpm install           # 仅首次需要
pnpm build             # 产出 lib/index.js + lib/client.js
```

### 第 2 步：在 DSH 中输入本地路径安装

打开 DSH → 左侧菜单点击 **插件** → 右上角 **+ 添加插件** → 对话框里输入本插件目录的**绝对路径**：

```
# Windows（推荐其中一种写法）
<plugin-root>
file:<plugin-root>
link:<plugin-root>

# macOS / Linux
/Users/you/src/deepseek-harness-dashboard
file:/Users/you/src/deepseek-harness-dashboard
```

然后点 **安装**。安装成功后：
- 插件会出现在"已安装"列表
- 默认是**启用状态**（`cordis.patch.yml` 里 `disabled: false`），可在插件管理面板关闭
- 启用后左侧菜单栏出现 **大伟的仪表盘** 图标
- 点击图标 → 主面板显示武汉介绍

### 其他安装方式（进阶）

| 方式 | 说明 |
|---|---|
| npm 包名 | 对话框输入 `dsh-dashboard-wuhan`（需要先发布到 npm registry） |
| GitHub 仓库 | `github:your-org/dsh-dashboard-wuhan` 或 `git+https://...` |
| tarball | `https://.../package.tgz` 或本地 `<local-path>\package.tgz` |
| cordis.patch.yml | 手动编辑 profile 的 `cordis.patch.yml`，用 `file:` 协议引用路径 |

### DSH 源码依据

DSH Host 端源码文件 `packages/boot/plugin-manager/src/install-spec.ts`（位于 `<dsh-source-root>` 仓库内）的 `parseInstallSpec()` 函数显式支持：

```
parseInstallSpec(raw) → ParsedInstallSpec
  ├─ kind: 'path'    ← 本地目录（绝对路径 或 file:/link: 前缀）
  ├─ kind: 'tarball' ← .tgz / .tar.gz（本地或 http）
  ├─ kind: 'git'     ← GitHub / GitLab / git+https
  └─ kind: 'registry'← npm 包名 @ 版本
```

注意：**本地路径必须是绝对路径**，相对路径（`./xxx`、`../xxx`）会被拒绝并提示 "a local path must be absolute"。

## 参考

基于 DSH 官方插件架构（Slot + Cordis DI）实现，参考了：
- `@deepseek-ai/dsh-client-ui-layout` —— `main` slot 声明方
- `@deepseek-ai/dsh-client-ui-sidebar` —— `sidebar.panellist` slot 声明方
- `dsh-superagent` —— 完整的 sidebar + main panel 示例
