# DSH 插件集合

本仓库收集了一组基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）官方扩展机制开发的插件，覆盖登录鉴权、会话总结、界面主题、Agent 模式、工具面板与品牌定制等场景。

所有插件均**不修改 DSH 源码**，通过官方提供的 Slot 注入、Cordis 组合补丁、主题 token 覆盖、预设声明等扩展点接入，可独立安装、停用与卸载。

## 插件清单

| 目录 | 包名 | 版本 | 简介 |
|---|---|---|---|
| [deepseek-harness-content](./deepseek-harness-content) | `deepseek-harness-content` | 0.1.0 | **大伟总结**：在会话标签条追加「大伟总结」面板，用会话自身的模型把整段对话提炼成关键信息并存储于本机 `localStorage`。 |
| [deepseek-harness-dashboard](./deepseek-harness-dashboard) | `dsh-dashboard-wuhan` | 0.1.0 | **大伟的仪表盘**：在左侧菜单注册入口，主面板展示武汉城市介绍（中英文双语、跟随 DSH 明暗主题）。 |
| [deepseek-harness-login](./deepseek-harness-login) | `deepseek-harness-login` | 0.4.4 | **自有账户登录**：拦截登录入口，改为本地用户名密码校验，适用于内网 / 离线部署，无需连接 DeepSeek 服务。 |
| [deepseek-harness-model](./deepseek-harness-model) | `deepseek-harness-model` | 0.1.0 | **大伟模式**：新增一条 Agent 预设（排在模式列表最末），自带 `dawei_probe` 探针用于验证模式是否真实生效。 |
| [deepseek-harness-simple-loop](./deepseek-harness-simple-loop) | `dwh-simple-loop` | 0.1.2 | **简单循环 Agent**：不调用大模型的自定义 agent loop，支持复读与字符倒序两种模式。 |
| [deepseek-harness-skin](./deepseek-harness-skin) | `dsh-skin-techno-neon` | 0.2.0 | **科技霓虹皮肤**：赛博青配色、霓虹品牌标识、冷色边缘光效，以 token 覆盖层叠加在内置主题之上。 |
| [deepseek-harness-work](./deepseek-harness-work) | `@local/dsh-calculator` | 1.0.0 | **计算器工具**：侧边栏底部入口，弹出浮层计算器，支持四则运算、键盘输入、中英双语。 |
| [deepseek-harness-xuya](./deepseek-harness-xuya) | `dsh-xuya-customization` | 0.1.0 | **叙芽岛品牌定制**：定制 DSH 的视觉与应用品牌（主题、Web/Windows 素材、安装包），保留官方布局。 |

## 目录结构

```
dsh-plugin/
├── deepseek-harness-content/      # 会话总结（TypeScript，需构建）
├── deepseek-harness-dashboard/    # 武汉仪表盘（TypeScript，需构建）
├── deepseek-harness-login/        # 自有账户登录（纯 JS，免构建）
├── deepseek-harness-model/        # 大伟模式预设（纯 JS，免构建）
├── deepseek-harness-simple-loop/  # 简单循环 Agent（纯 JS，免构建）
├── deepseek-harness-skin/         # 科技霓虹皮肤（纯 JS，免构建）
├── deepseek-harness-work/         # 工作工具集合（含计算器）
└── deepseek-harness-xuya/         # 叙芽岛品牌定制（pnpm workspace，需构建）
```

> **构建说明**：`content`、`dashboard`、`xuya` 包含 TypeScript 源码，安装前需执行 `pnpm install && pnpm build` 生成 `lib/`；其余插件的 `lib/` 为手写成品，可直接被 Loader 加载。

## 安装方式

### 方式一：DSH 插件管理面板（推荐）

打开 DSH → 侧栏 **插件** → **添加插件** → 输入对应插件目录的**绝对路径**：

```
<repo-root>\deepseek-harness-login
```

安装成功后在列表中启用开关即可（部分插件需重启 DSH）。

### 方式二：手动写入 profile

编辑 `$DSH_HOME/profiles/<profile>/package.json`（Windows 默认 `C:\Users\<你>\.dsh\profiles\<profile>`）：

```json
{
  "dependencies": {
    "deepseek-harness-login": "link:<repo-root>/deepseek-harness-login"
  },
  "dsh": {
    "profile": {
      "bundles": ["deepseek-harness-login"]
    }
  }
}
```

在 profile 目录执行 `pnpm install`（建议使用 DSH 自带的 pnpm），重启 DSH。

### 方式三：cordis.patch.yml 挂行

若包已能被 profile 解析，可直接在 profile 的 `cordis.patch.yml` 中插入：

```yaml
- insert:
    - id: deepseek-harness-login
      name: deepseek-harness-login
```

## 开发与构建

需构建的插件（`content`、`dashboard`、`xuya`）：

```bash
pnpm install
pnpm build        # 产出 lib/
pnpm typecheck    # 类型检查
```

免构建的插件（`login`、`model`、`simple-loop`、`skin`、`work/dsh-calculator`）直接修改 `lib/` 或根目录下的 JS 文件即可，保存后由 DSH 的 client HMR 热更新或刷新页面生效。

## 安全与隐私

- 所有插件均不向第三方服务器上传数据；
- `deepseek-harness-login` 的凭据默认硬编码在源码中（`dawei / 123456`），正式部署请对接后端鉴权；
- `deepseek-harness-content` 的总结结果仅存于浏览器 `localStorage`，不写入会话日志；
- 本仓库已剔除 `node_modules`、编译产物、`.verify/`、`.runtime/` 等中间目录与本地凭据。

## License

各插件独立声明许可证，详见各自 `package.json` 与 `README.md`。
