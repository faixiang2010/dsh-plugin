# 自定义 loop 切换后没有 agent factory

排查日期：2026-11-04。宿主：本机 DeepSeek Harness，DSH 0.2.1-rc.5。

## 结论

已复现一个与实际安装记录一致的确定性故障：插件以 profile 外部的目录链接加载，但 package.json 没有声明宿主依赖的 peerDependencies。模块导入失败，工厂注册代码没有执行；bundle patch 却已禁用内置 agent-loop，于是没有任何工厂可以创建或恢复 agent。

这不是消息内容导致的异常。用户使用插件页面直接切换。此次没有修改正式插件源码、实际 desktop profile 或用户会话。

## 证据

1. 实际 desktop 安装日志 `.plugin-manager/logs/operation-3IHyjR/pnpm.log` 记录了 `dwh-simple-loop 0.1.0 <- <local-path>`；卸载日志 `operation-T2sCb5/pnpm.log` 也记录了这个外链依赖。排查时 desktop 已无该依赖，市场状态将其列为 disabled，不能读取当次故障现场的实时工厂状态。
2. 当前 index.js 第 5 行导入 `@deepseek-ai/cordis`，还直接导入 dsh-session；agent.js 直接导入 dsh-agent、dsh-llm、dsh-scope。package.json 未声明这些 peerDependencies。
3. 当前 cordis.patch.yml 第 3–4 行先禁用内置 agent-loop，第 6 行起插入自定义实现。
4. 本机安装包 `dsh-app-boot/lib/index.js` 的 findInterceptionLayer（约 1337 行）、readPeerNames（约 1347 行）、routeLinked（约 1676 行）显示：profile 外部链接采用 linked 路由；匹配 peerDependencies 的包才转向宿主包表。没有声明的包继续走原生模块解析。
5. 宿主 dsh-agent 的 requireFactory() 在 factory 为空时抛出截图中的 `no agent factory registered (load an agent-loop plugin)`。它发生在插件 createAgent/resume 真正执行之前。

## 隔离实验

全部使用项目 .verify/investigation 下独立 DSH_HOME，未复用正式凭据。临时服务只监听 127.0.0.1:60709。

| 安装方式 | 结果 |
| --- | --- |
| profile 内 vendor 实体副本 + junction | 模块加载、构造、创建 agent 成功；浏览器发消息得到复读回复 |
| 上述安装方式，在插件页面关闭再启用 | 构造再次成功；已有会话继续发消息得到复读回复 |
| 外链直接指向当前项目，未修改依赖声明 | 宿主警告 `1 entry did not activate`，导入失败 |
| profile 外隔离副本，只补齐 5 个 peerDependencies | 无上述导入警告；模块、构造、创建 agent 成功；浏览器发消息得到复读回复 |

外链失败时的关键原始错误：

```text
dwh-simple-loop (dwh-simple-loop): failed to import:
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@deepseek-ai/cordis'
imported from <local-path>\index.js
```

补齐 peer 的外链副本日志摘要：

```text
2026-11-04T08:30:12.025Z module loaded (pid 32232)
2026-11-04T08:30:12.451Z constructor ok · mode=echo
2026-11-04T08:30:14.098Z published agent ... (startup)
```

## 建议修正

package.json 补齐下列声明；版本按本次验证过的宿主固定，后续兼容范围需另行验证：

```json
"peerDependencies": {
  "@deepseek-ai/cordis": "~4.0.5",
  "@deepseek-ai/dsh-session": "0.2.1-rc.5",
  "@deepseek-ai/dsh-agent": "0.2.1-rc.5",
  "@deepseek-ai/dsh-llm": "0.2.1-rc.5",
  "@deepseek-ai/dsh-scope": "0.2.1-rc.5"
}
```

已有 switch-loop.ps1 的 profile 内 vendor 安装方式也是经过验证的绕行方案。README 的“profile 外链接一定不可用”需改为有条件说明；脚本注释中的“被 pnpm 清理是本次根因”没有本次故障的直接证据。

index.js 顶部注释声称加载失败会写 boot.log，但静态 import 失败发生在模块正文执行之前，trace() 根本没有机会运行。因此没有 boot.log 不能证明插件未被尝试加载，应查看宿主的 failed to import 警告。

## 验证边界

已验证初始化、实际消息回复和 profile 内安装的页面开关。未重放用户原始故障进程，也未验证任意历史持久化会话、全部第三方插件组合或不同 DSH 版本。上面的结论基于当前源码、安装记录、宿主实现及隔离对照实验；未把原截图的历史实例宣称为完整复现。

隔离进程与本次创建的测试目录在排查后清理。排查前已有的 .verify 数据保留。
