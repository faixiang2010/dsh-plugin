# DSH 叙芽岛定制

本项目只定制 DeepSeek Harness 的视觉与应用品牌。xuya-island 是只读参考，运行与构建均不访问它。浅色参考主站的暖白、芽绿、圆角及字体；深色使用对应的绿灰配色，保留 DSH 会话、工具、工作区与设置布局。

## 项目组成

- `packages/ui`：Host 首屏样式与浏览器主题、品牌插槽。主题、样式和插槽随插件退出撤销。
- `packages/bundle`：关闭官方品牌插件并加载定制 UI 的组合配置。
- `brand.json`、`assets`：品牌配置与生成的 Web、Windows 素材。
- `scripts`：独立构建、运行、升级接入检查。
- `reports`：验收结果与截图；`.runtime` 是忽略入库的本地运行副本和隔离预览数据。

DSH 默认位置为同级的 `../deepseek-harness`。定制项目不加入它的工作区。当前兼容记录见 `upstream.json`；上游接口仍可能在同版本内变化，因此版本检查不能替代构建与回归。

## 安装和构建

在本目录执行：

```powershell
pnpm install
node scripts/integration.mjs check
pnpm run build
pnpm run typecheck
pnpm test
pnpm run build:dsh
```

首次接入全新 DSH 检出时，先执行 `node scripts/integration.mjs apply`，再运行上述检查。当前开发目录已完成接入。构建使用当前 DSH 的 Client bundler，从而保持与其动态模块协议一致；外置项目独立维护依赖和锁文件。

## 运行

```powershell
pnpm run start:web
pnpm run start:desktop
```

Web 默认固定使用端口 `3090`（`http://127.0.0.1:3090`）。如需改用其他端口，设置 `XUYA_WEB_PORT` 即可覆盖。不要公开日志中的访问令牌。启动脚本安装构建产物的文件副本到独立运行目录，再通过 Loader 覆盖层加载，不依赖指向插件源码的临时链接。

默认不改变 DSH 的数据位置。若只想独立预览，可先设置：

```powershell
$env:DSH_HOME = Join-Path $PWD '.runtime/preview-home'
```

桌面开发启动默认沿用上游开发数据目录；`DSH_HOME` 与 `DSH_DESKTOP_USER_DATA_DIR` 可分别指定隔离的 DSH 与 Electron 数据。首次桌面启动需要下载上游固定版本的 Electron 和 primary runtime。通过本机代理下载时，在当前终端设置 `HTTP_PROXY`、`HTTPS_PROXY`，并设置 `ELECTRON_GET_USE_PROXY=1`、`NODE_USE_ENV_PROXY=1`、`NO_PROXY=127.0.0.1,localhost,::1`。

## 启动品牌回归

启动隔离预览后，将控制台输出的完整本地 URL 临时设为 `XUYA_QA_URL`，执行 `pnpm run test:boot`。脚本使用 DSH 自带的 Playwright 开发依赖和本机已安装的 Google Chrome，在独立无头浏览器上下文中验证真实浅深色启动页、启动失败页和释放后进入界面。它通过 DSH 已有的启动就绪延迟对象控制验收时点，不修改生产页面内容；外部站点请求在测试上下文中被阻止。不要把含令牌的 URL 写入文档或提交。

## Windows 安装包

```powershell
pnpm run package:windows
```

该命令复用 DSH 原有无签名打包流程，使用本项目生成的独立配置，不读取签名凭据。打包配置使用叙芽岛展示名称、窗口/托盘图标、安装器素材与配色，保留原应用标识与内部产品名以保持用户数据位置，并阻止官方更新检查。定制 UI 在运行时完整性清单生成前复制进安装产物。

本机预检缺少 Visual C++ Build Tools：找不到 Microsoft Visual Studio Installer 的 `vswhere.exe`。按用户选择未安装工具链，因此当前没有生成 Windows 安装包。以后安装带 MSVC x64/x86 和 Windows SDK 的 C++ Build Tools 后重新执行该命令。 开发启动使用现成 Electron；安装包流程还需把上游 `window-frame.cpp` 编译成安装器 DLL，因此能启动桌面并不表示已具备安装包编译环境。补齐工具后仍需完成打包与安装验证。签名与并行安装不属于首版范围。

## 更新 DSH

1. 停止由本项目启动的 DSH 服务，保留自己的其他修改。
2. 执行 `node scripts/integration.mjs remove` 撤销这份接入补丁；反向校验不匹配时会停止。
3. 使用 Git 更新 DSH，上游发生分叉或本地修改冲突时先处理。
4. 执行 `node scripts/integration.mjs apply`；补丁不适配时会报错，不进行源码字符串替换。
5. 复核上游版本与插件接口，更新兼容记录，重新执行构建、测试和实际页面检查。

`integration.patch` 保存当前接入改动。更新后需重新生成与验证此补丁，不要仅修改版本号来绕过不兼容。

## 恢复原版展示

不加载定制覆盖层可恢复 DSH 默认主题与品牌插槽。网页标题、PWA 图标和桌面资源属于构建产物，需要清除 `DSH_BRAND_CONFIG` 后重新构建 DSH 才能恢复。该过程不删除会话或改写数据格式。

## 验证范围

具体命令、通过项和未验证项见 `reports/verification.md`。本轮未执行真实模型调用，未声称验证模型回复或流式输出。Windows 安装包受工具链缺失阻塞；Web 截图是实际 DSH 服务，未使用静态仿制页面。
