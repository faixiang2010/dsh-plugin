# Techno Neon — DeepSeek Harness 皮肤插件

一个**独立于 DSH 仓库**的皮肤包：不改 `deepseek-harness` 任何源码，通过官方的 token 覆盖层与样式注入扩展点，为 Web 客户端换上一套科技感配色、霓虹品牌标记和冷光浮层。

- 深色：深海蓝黑底 + 青色品牌色 + 靛蓝渐变
- 浅色：冷调纸面 + 深青品牌色
- 品牌标记替换为霓虹六边形，品牌名走青→靛渐变
- 选区、滚动条、代码块、diff、浮层描边全部跟随新配色

## 目录结构

```
deepseek-harness-skin/
├── package.json          # bundle 声明（dsh.bundle.patch）+ client 声明（dsh.client）
├── cordis.patch.yml      # bundle 补丁层：向 profile 组合里插入一行插件
└── lib/
    ├── index.js          # Host 半边：空插件，保证 bundle 行能加载
    └── client.js         # 浏览器半边：叠加 token 层 + 注入作用域样式
```

`lib/` 下是可直接被 Loader 加载的成品，无需构建、无第三方依赖。

## 它是怎么接进去的

DSH 的正规扩展点，全部在插件侧完成：

| 目标 | 用到的扩展点 |
|---|---|
| 换配色 | `ctx.theme.overrideTokens()` 在当前内置主题之上叠加一层 token，`{ light, dark }` 成对提交；ThemePresenter 以内联 CSS 变量写到 `body`，天然覆盖内置 token 表 |
| 换 logo / 品牌名 / 选区 | 插件自有 `<style>`，全部规则用 `html[data-dsh-skin="techno-neon"]` 作用域 |
| 掉层自愈 | 覆盖层归属于调用方的 effect 作用域；插件重载或宿主清理 effect 会丢层，用标记 token 探测并重放 |

所以皮肤是**叠加**在内置 `light` / `dark` 之上的，不是独立主题：外观偏好保持用户原值，浅/深切换时皮肤自动跟随。停用插件后界面立刻回到官方原样。

> 为什么不用 `theme.register()` + `setTheme()`？Host 只持久化 `light | dark | system` 三档偏好，第三方主题 id 只存在于运行时；设置作用域每次 `adopt()`（启动、重连、任意设置写入）都会用持久值覆盖它，皮肤就会自己弹回，重启更不会保留。`overrideTokens()` 不碰偏好，因此没有可被覆盖的状态。

## 安装

### 方式一：Web 插件页（推荐）

侧栏 → **Plugins** → 安装 / 添加本地包 → 选择本目录：

```
D:\electron\deepseek-harness-skin
```

插件管理器会把它加入当前 profile 的依赖并启用 bundle。

### 方式二：手动写 profile

编辑 `$DSH_HOME/profiles/<profile>/package.json`（Windows 默认 `C:\Users\<你>\.dsh\profiles\<profile>`），照现有字段结构补两处：

```json
{
  "dependencies": {
    "dsh-skin-techno-neon": "file:D:/electron/deepseek-harness-skin"
  },
  "dsh": {
    "profile": {
      "bundles": ["dsh-skin-techno-neon"]
    }
  }
}
```

然后在 profile 目录执行 `pnpm install`，重启 DSH。

> `bundles` 的顺序决定补丁层优先级，放在最后即可覆盖内置样式。

### 方式三：已有 profile 直接挂行

如果包已能被 profile 解析（例如已安装为本 profile 依赖），也可以只在 profile 的 `cordis.patch.yml` 里插入：

```yaml
- insert:
    - id: skin-techno-neon
      name: 'dsh-skin-techno-neon'
```

## 生效与切换

插件加载后立即在当前配色之上叠加皮肤层，**不改写**「设置 → 外观」里的偏好：

- 官方「浅色 / 深色 / 跟随系统」三档照常可用；切到浅色或深色时，皮肤层按新模式重建，配色随之切换；
- 皮肤不会出现在外观列表里，因为它不是独立主题，而是 token 覆盖层；
- 偏好为「跟随系统」时，系统切换深浅色，皮肤自动跟随。

覆盖层挂在插件的 effect 作用域上：插件重载、client 重连或宿主清理 effect 时，这一层会被移除。插件会在 `theme/change`、窗口重新获得焦点、页面重新可见，以及每 15 秒（页面隐藏时跳过）探测一次标记 token `--dsh-skin-techno-neon-layer`，发现层丢失就重放，所以不会出现「用着用着配色自己跳回默认」。

想彻底停用：在 Plugins 页关闭该 bundle，或从 `bundles` 列表里移除。

## 自定义

改 `lib/client.js` 里的两个对象即可，键名是 DSH 的语义 token：

- `DARK_TOKENS` — 深色皮肤（当前 104 个覆盖）
- `LIGHT_TOKENS` — 浅色皮肤（当前 92 个覆盖）

可用 token 名以 `deepseek-harness/packages/client/ui-theme/src/styles/design-platform.css` 为准，常用几组：

| token | 作用 |
|---|---|
| `--dsw-alias-bg-base` / `-layer-1..3` | 画布与层层抬升的表面 |
| `--dsw-specific-sidebar-fill` | 侧栏底色 |
| `--dsw-alias-brand-primary` | 品牌色（主按钮填充、强调） |
| `--dsw-alias-label-primary` / `-secondary` / `-tertiary` | 三级文字 |
| `--dsw-alias-border-l1..l4` | 四级边框 |
| `--dsw-alias-markdown-code-block` | 代码块底色 |

改完刷新页面即可（Client 插件按文件加载，无需重新构建）。

品牌标记在 `BRAND_MARK_SVG`，直接替换其中的 SVG 字符串；品牌名渐变、选区颜色在 `ENHANCEMENT_CSS`。

## 已知边界

- 设置页的「外观」行由官方硬编码为三档；本插件用覆盖层叠加，因此皮肤不出现在其中，也不需要写入偏好。
- 加载前的 boot 页由官方硬编码配色，皮肤生效前的短暂首屏仍是原色。
- 品牌标记依赖官方 `FishLogo` 的 `viewBox="0 0 23.16 17.04"` 作为稳定选择器；如果上游改了几何尺寸，需同步更新 `ENHANCEMENT_CSS` 里的两处选择器。
