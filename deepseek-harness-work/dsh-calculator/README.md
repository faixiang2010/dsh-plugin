# Calculator — DeepSeek Harness 计算器插件

一个**独立于 DSH 仓库**的工具包：不改 `deepseek-harness` 任何源码，通过官方的 slot 注入与本地化扩展点，在侧边栏底部加一个图标按钮，点开就是浮在界面上的计算器面板。

- 四则运算（`+ − × ÷`）、小数、`%`、正负号、退格、清空
- 连续运算：`2 + 3 × 4 =` 按输入顺序逐步求值，屏幕上方显示当前表达式
- 键盘输入、点面板外任意位置自动关闭、除以零本地化报错
- 文案中英双语，跟随界面语言即时切换

## 目录结构

```
dsh-calculator/
├── package.json          # bundle 声明（dsh.bundle.patch）+ client 声明（dsh.client）
├── cordis.patch.yml      # bundle 补丁层：向 profile 组合里插入一行插件
├── index.js              # Host 半边：空插件，保证 bundle 行能加载
├── client.js             # 浏览器半边：状态机 + 组件 + 样式
├── locale/
│   ├── en.json           # 插件元信息与英文文案
│   └── zh.json           # 中文文案
└── icon.svg              # 插件图标
```

纯浏览器插件：计算全部在 `client.js` 里完成，无需构建、无第三方依赖。

## 它是怎么接进去的

DSH 的正规扩展点，全部在插件侧完成：

| 目标 | 用到的扩展点 |
|---|---|
| 侧边栏入口按钮 | `ctx.slots.register('sidebar.footer.action', …)` 注册 `calculator-toggle`（`order: 6`），侧边栏展开时显示文字标签 |
| 计算器面板 | `ctx.slots.register('shell.overlay', …)` 注册 `calculator`（`order: 50`），仅打开时渲染，固定在左下角、侧边栏之上 |
| 样式 | 在 `ctx.effect` 里向 `document.head` 插入插件自有 `<style>`，模块加载器会认领并在卸载时清除；类名全部 `dshcalc-` 前缀，颜色走 `--dsw-alias-*` 主题变量，跟随明暗主题 |
| 文案 | `ctx.locale.register('calculator', 'en'|'zh', dict)` + `ctx.locale.bind('calculator')`，语言切换即时生效；内置词表兜底，绝不会把 key 直接显示出来 |

面板的开关由插件自有的 store 管理：点侧边栏按钮、`Esc`、点面板外任意位置（捕获阶段监听 `pointerdown`，命中面板内部或入口按钮则忽略）都会关闭；面板关闭时不渲染、不监听任何键盘事件，不会抢聊天输入框。

> 计算逻辑是与 React 无关的纯状态机 `reduce(state, action)`，`node calc-check.mjs` 可在无浏览器环境下验证运算、键盘映射与渲染输出。

## 安装

### 方式一：Web 插件页（推荐）

侧栏 → **Plugins** → 安装 / 添加本地包 → 选择本目录：

```
<plugin-root>
```

插件管理器会把它加入当前 profile 的依赖并启用 bundle。让 agent 代装也可以，与界面等价：

```jsonc
// 安装（bundle 方式，写入 profile 的 patch 层）
plugin_manager({ action: "install_bundle", target: "./" })

// 卸载
plugin_manager({ action: "remove_bundle", target: "@local/dsh-calculator" })
```

本包在工作区里通过 junction 链进 profile，**改完 `client.js` 保存即可热更新**：host 端的 `client-hmr` 每 500ms 轮询每个 client bundle 的 mtime，变化后经 `/plugins/events` SSE 通知页面重新加载该模块，无需刷新页面。

### 方式二：手动写 profile

编辑 `$DSH_HOME/profiles/<profile>/package.json`（Windows 默认 `C:\Users\<你>\.dsh\profiles\<profile>`），照现有字段结构补两处：

```json
{
  "dependencies": {
    "@local/dsh-calculator": "file:./"
  },
  "dsh": {
    "profile": {
      "bundles": ["@local/dsh-calculator"]
    }
  }
}
```

然后在 profile 目录执行 `pnpm install`，重启 DSH。

### 方式三：已有 profile 直接挂行

如果包已能被 profile 解析（例如已安装为本 profile 依赖），也可以只在 profile 的 `cordis.patch.yml` 里插入：

```yaml
- insert:
    - id: calculator
      name: '@local/dsh-calculator'
```

## 使用

- 开关面板：点侧边栏底部的计算器图标按钮；`Esc`、面板右上角 `×`、或点击面板外任意位置均可关闭
- 键盘（面板获得焦点时）：`0-9` `.` `+ - * /` `%`、`Enter`/`=` 求值、`Backspace` 退格、`Delete`/`C` 清空、`Esc` 关闭
- 除以零显示本地化错误文案，按任意数字键自动恢复
- 数字格式化：12 位有效数字，超出 `1e12` 或小于 `1e-9` 用科学计数法

## 自定义

- 面板位置与外观：改 `client.js` 末尾 `CSS` 里的 `.dshcalc`（`left` / `bottom` / 宽度）与各 `dshcalc-*` 规则
- 键位布局：改 `client.js` 里的 `KEYS` 数组
- 文案：改 `locale/en.json`、`locale/zh.json`，或 `client.js` 顶部的 `EN` / `ZH` 兜底词表

改完保存即可热更新，无需刷新页面。

## 已知边界

- 面板打开时自动获得焦点以接收键盘输入；点击面板内按钮后会重新聚焦面板
- 点外关闭监听的是 `pointerdown` 捕获阶段，入口按钮（`.dshcalc-toggle`）被排除在外，避免「先关又被切换重开」
