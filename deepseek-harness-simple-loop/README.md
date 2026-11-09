# dwh-simple-loop

不调用大模型的自定义 agent loop，支持复读和倒序。适配并验证于 DSH 0.2.2-rc.1。

## 在界面开关

首次安装或升级，在本项目目录执行一次：

```powershell
powershell -ExecutionPolicy Bypass -File .\switch-loop.ps1 install
```

完全退出并重新打开 DeepSeek Harness 一次，然后进入 **插件 → 已安装插件 → dwh-simple-loop**：

- 打开开关：使用自定义复读/倒序 loop。
- 关闭开关：恢复 DSH 内置 loop；插件仍保留在列表，随时可以再次打开。
- 等开关完成切换后再发消息。正常界面切换无需重启；如果宿主提示需要重启，按提示操作。

安装脚本首次安装默认关闭，更新时保留原来的开关状态。脚本直接修改磁盘配置，所以执行脚本后需要重启一次；之后使用界面开关即可。

开关影响整个应用的 agent 工厂。关闭时自定义 agent 会停止并释放，会话记录保存到宿主存储；后续恢复会话由当前启用的 loop 处理。内置 loop 的实际模型回复仍需要正常配置模型和账号。

## 对话命令

| 输入 | 行为 |
| --- | --- |
| 普通消息 | 默认原样复述 |
| `/mode` | 显示当前模式和帮助 |
| `/mode 1` | 复读 |
| `/mode 2` | 字符倒序 |

模式在本次启用的所有自定义会话间共享，重新启用后恢复 echo。回复带有 `dsh-simple-loop · 模式 1/2` 或 `模式 2/2` 标记。

## 脚本操作

```powershell
.\switch-loop.ps1 install  # 安装/更新；首次默认关闭，已有安装保留开关
.\switch-loop.ps1 status   # 查看磁盘配置与安装状态
.\switch-loop.ps1 on       # 离线启用，之后重启 DSH
.\switch-loop.ps1 off      # 离线停用，保留安装，之后重启 DSH
```

默认 profile 为 desktop，可用 `-ProfileName <name>` 或 `-ProfileDir <绝对路径>` 指定其他 profile。

脚本将正式文件复制到 `<profile>/vendor/dwh-simple-loop`，创建 node_modules junction 并登记 `link:./vendor/dwh-simple-loop` 依赖。不会运行 pnpm 或递归删除已有目录；遇到 node_modules 下已有同名实体目录会停止并保留它。

也支持通过宿主插件管理器安装本项目目录链接。package.json 已声明直接使用的宿主包 peerDependencies，DSH 可以将 profile 外的链接插件导向宿主依赖。无需在本项目中另装一套 DSH 核心包。

## 实现

| 文件 | 用途 |
| --- | --- |
| `package.json` | bundle 描述及宿主 peer 依赖 |
| `cordis.patch.yml` | 启用插件时禁用内置 loop 并插入自定义 loop；停用 bundle 后恢复内置配置 |
| `index.js` | 工厂注册、会话创建/恢复、持久化句柄及卸载清理 |
| `agent.js` | 消息队列、复读/倒序和 session 事件 |
| `switch-loop.ps1` | 安装更新及离线开关 |
| `docs/diagnostics/` | 排查与验证记录 |

## 排查

插件运行日志在安装副本的 `logs/boot.log`。静态 import 失败发生在模块代码执行前，此时不会产生插件日志，需要查看宿主的 `failed to import` 警告。

若出现 `no agent factory registered`，优先核对插件依赖声明、实际安装位置及宿主加载警告。内置 loop 已被禁用而自定义实现未成功注册时，就会出现该错误。

开关状态有两处记录，脚本会同时写入：本 profile 的 `package.json` `dsh.profile.bundles`，以及 dshmarket 的 `.dsh-market/state.json` `disabled` 列表。只改其中一处（例如手工改 bundles 或直接编辑文件）会让两者不一致：bundles 里已启用、市场记录仍写着禁用时，启动后市场会把自定义 loop 关掉，而内置 loop 又被本插件的 patch 关闭，于是没有 agent factory。用 `switch-loop.ps1 on/off` 切换并重启一次即可恢复一致。

在「插件」页面关闭开关后，如果宿主提示需要重启，请按提示重启再继续使用；未重启时也可能短暂出现上述无工厂错误，重启后由内置 loop 接管。

开关是热替换 agent loop：切换瞬间宿主会销毁当前所有 agent（`loop disabled; agents disposed`），而内置 loop 要到下次启动才回来，所以运行中的实例会短暂没有 factory，客户端左侧会话列表也会变成空的。会话数据本身没有删除（仍在 `~/.dsh/sessions` 与 `~/.dsh/storages`），重启 DSH 后列表恢复。切换开关后建议直接完全重启，不要在当前实例里连续点开关。

旧问题及对照实验见 [诊断记录](docs/diagnostics/2026-11-04-agent-factory.md)。
