# 大伟模式 — DeepSeek Harness 模式插件

一个**独立于 DSH 仓库**的模式（Agent 预设）包：不改 `deepseek-harness` 任何源码，通过官方组合包补丁与预设扩展点，为 Web / 桌面客户端新增一个可选择的模式，并自带一套可复现的生效性验证。

- 模式名：**大伟模式**（内部 id `dawei`，运行时标记 `DAWEI-MODE`）
- 在模式选择列表里固定排在**最下面**（`order: 1000`）
- 工具底座：持久化终端（Windows 走 pwsh）+ 读图 + 上下文压缩
- 自带探针工具 `dawei_probe`，**只在该模式作用域存在**，用于证明模式真实生效

## 快速开始（4 步）

1. 安装：DSH 侧栏 **Plugins** → 添加本地包 → 选 `D:\electron\deepseek-harness-model`
2. **完全退出并重启**桌面端（改了 profile 的 bundle 列表，必须重启）
3. 新建任务 → 模式下拉最下面选「大伟模式」→ 输入 `大伟自检`
   - 预期：出现 `工具调用 · dawei_probe`，返回 `DAWEI-MODE-OK`
4. 在本目录执行 `node verify.mjs`
   - 预期：全部 `PASS`，其中 `C4 真实运行证据` 记录你刚才那次会话

## 目录结构

```
deepseek-harness-model/
├── package.json          # bundle 声明（dsh.bundle.patch）+ main（探针插件）
├── cordis.patch.yml      # bundle 补丁层：向 profile 组合插入 preset-dawei 声明
├── index.js              # Host 半边：在模式作用域注册 dawei_probe 并落盘证据
└── verify.mjs            # 体检 + 实验判定脚本（零依赖）
```

全部文件可直接被 Loader 加载，**无需构建、无第三方依赖**。

## 它是怎么接进去的

DSH 的正规扩展点，全部在插件侧完成：

| 目标 | 用到的扩展点 |
|---|---|
| 新增模式 | bundle 补丁插入一行 `@deepseek-ai/dsh-agent-preset`，`config` 里声明 `id / name / description / order / plugins` |
| 排在列表最末 | `AgentPresetRegistry.list()` 按 `(order ?? Infinity, id)` 排序；内置模式是 1~4，本包用 `order: 1000` |
| 中文名 | 自定义预设直接用 `config.name` 显示，不需要改客户端语言包（词典只覆盖 `standard/ptc/minimal/cordis` 四个内置 id） |
| 模式内工具 | 预设 `plugins` 里的子行 `name: 'deepseek-harness-model'` 以模式作用域挂载，`ctx.tools.register()` 注册探针；包已作为 profile 依赖，裸包名可解析 |
| 人格差异 | `@deepseek-ai/dsh-persona` 的 `prefix` 写入 `DAWEI-MODE` 自检协议 |

所以模式是**叠加**在 DSH 组合之上的独立预设，不占端口、不写全局状态。停用该 bundle 后，模式列表立刻回到原样。

> 为什么 `order` 不是 5 或 100？本机 profile 里的 `loop-engine-*` 预设已经是 100。要保证永远在最下面，用一个明显大于所有现有值的数字；若以后有更高 order，同步调大即可。

## 安装

### 方式一：Web / 桌面「插件」页（推荐）

侧栏 → **Plugins** → 安装 / 添加本地包 → 选择本目录：

```
D:\electron\deepseek-harness-model
```

插件管理器会把它加入当前 profile 的依赖并启用 bundle。

### 方式二：手动写 profile

编辑 `$DSH_HOME/profiles/<profile>/package.json`（Windows 默认 `C:\Users\<你>\.dsh\profiles\<profile>`），补两处：

```json
{
  "dependencies": {
    "deepseek-harness-model": "link:D:/electron/deepseek-harness-model"
  },
  "dsh": {
    "profile": {
      "bundles": ["deepseek-harness-model"]
    }
  }
}
```

然后在 profile 目录安装依赖并重启 DSH：

```powershell
# profile 若由 pnpm 11 安装过，必须用同版本，否则报 ERR_PNPM_UNEXPECTED_STORE
node "$env:LOCALAPPDATA\node\corepack\v1\pnpm\<版本>\bin\pnpm.cjs" add "link:D:/electron/deepseek-harness-model"
```

> `bundles` 的顺序决定补丁层优先级，放在最后即可覆盖前面的层。

### 方式三：已有 profile 直接挂行

如果包已能被 profile 解析（已作为依赖安装），也可以只在 profile 的 `cordis.patch.yml` 里插入整套声明（内容同本包的 `cordis.patch.yml`），重启生效。

> 注意：`desktop` profile 由 Electron 应用独占管理，CLI 的 `--profile desktop` 会被拒绝；安装后需要通过桌面端重启加载，不能用 `dsh` 命令启动它。

## 使用

- 打开 DSH 后，新建任务的模式下拉列表**最下面**出现「大伟模式」；
- 选中它，会话的工具集里会多出 `dawei_probe`（其它模式没有）；
- 模式的人格前缀包含自检协议：用户要求「大伟自检」或询问当前模式时，必须先调用探针；
- 切回标准 / 极简 / 创造模式，`dawei_probe` 立即从工具集消失（模式作用域隔离）。

想彻底停用：在 Plugins 页关闭该 bundle，或从 `bundles` 列表里移除。

---

## 验证：`verify.mjs` 到底是什么

一句话：它是这个插件的**体检 + 实验判定器**，把「模式有没有装上、排得对不对、工具是不是只属于这个模式、有没有真的被调用过」翻译成一串 `PASS / FAIL / PENDING`。

它**不是**测试框架，也不需要模型参与；只有最后一条 `C4` 需要你在界面里真实跑一次。

### 为什么分两层

| 层次 | 依赖 | 能证明 | 不能证明 |
|---|---|---|---|
| 离线体检（A + B + C1~C3） | 只要 Node 和 DSH 源码 | 模式声明进了组合、排序最后、探针只属于该模式、探针本身可用 | 界面里是否真的能选中并调用 |
| 真机实验（C4） | 需要你重启后在界面里发一次 `大伟自检` | 模式在真实会话里挂载成功、工具被模型调用、证据落盘 | — |

所以正常流程是：**先跑离线体检确认配置没错，再去界面里跑一次，最后回来看 C4。**

### 怎么跑

在包目录执行（不需要装依赖）：

```powershell
cd D:\electron\deepseek-harness-model
node verify.mjs
```

### 逐条看懂输出

脚本按下面顺序打印，每条前缀是 `PASS` / `FAIL` / `PENDING`：

| 条目 | 大白话 | 失败说明什么 |
|---|---|---|
| `A2 组合包含大伟模式声明` | 组合配置里能找到 `id: dawei` 和它的名字、order | 补丁层没生效，包没装或 patch 没被应用 |
| `A3 显示名为「大伟模式」` | 下拉里显示的名字对 | `config.name` 写错 |
| `A4 大伟模式排在列表最下面` | 按 `(order, id)` 排序后它确实最后 | 有其它预设的 order 比 1000 更大 |
| `B1 探针行只在 dawei 预设内` | 别的模式（标准/极简等）没有引用本包，不会白送工具 | 补丁插错位置，工具泄漏成全局 |
| `A1 组合包已安装并启用` | profile 的 `dsh.profile.bundles` 里有本包 | 装错了 profile，或没在插件页启用 |
| `C1 探针工具已注册` | 直接调用 `index.js`，确认注册出的工具叫 `dawei_probe` | 代码坏了 |
| `C2 探针返回模式标记` | 直接执行一次探针，返回 `DAWEI-MODE-OK` | 返回值或 marker 被改坏 |
| `C3 探针写入证据行` | 证据文件确实写了一行 | 证据目录不可写 |
| `C4 真实运行证据` | 界面里真实会话调用过探针（`sessionId` 不是 `verify-local`） | 还没做真机实验，或模式没真正挂上 |

> `A0 组合 dump` 只在**失败时**打印；它表示脚本没能运行 DSH 的 `--dump-config`（通常是找不到源码目录）。

### 一次真实的成功输出

```
PASS  A2 组合包含大伟模式声明 — name=大伟模式 order=1000
PASS  A3 显示名为「大伟模式」 — 大伟模式
PASS  A4 大伟模式排在列表最下面 — standard(1) < ptc(2) < minimal(3) < cordis(4) < loop-engine-*(100) < dawei(1000)
PASS  B1 探针行只在 dawei 预设内 — 无泄漏
PASS  A1 组合包已安装并启用 — desktop（已扫描 web, desktop）
PASS  C1 探针工具已注册 — dawei_probe
PASS  C2 探针返回模式标记 — DAWEI-MODE-OK mode=dawei
PASS  C3 探针写入证据行 — C:\Users\<你>\.dsh\dawei-mode\evidence.jsonl
PASS  C4 真实运行证据 — 1 条，最新 2026-11-05T14:14:22.301Z session=session-xxxxxxxx
```

### 按场景看结果

- **刚装好、还没重启**：`A1` 通过即可；界面下拉还没出现属正常。
- **重启后、还没发过自检**：A/B/C 全 PASS，`C4 PENDING` —— 这是预期状态，不算失败（退出码仍是 0）。
- **发了 `大伟自检` 之后**：`C4` 变 PASS，实验完成。
- **`C4` 一直是 PENDING**：说明界面里没成功调用探针。检查当前模式是不是「大伟模式」、口令是否为 `大伟自检`，或直接说"调用 dawei_probe 工具"。

### 常见失败

| 现象 | 原因 / 处理 |
|---|---|
| `A0 组合 dump` 失败 | 找不到 DSH 源码。设 `DSH_SOURCE` 指向本机 `deepseek-harness` 目录，或加 `--skip-dump` |
| `A1` 失败 | 本包没进 profile 的 `bundles`；装的是别的 profile（`web` 与 `desktop` 各自独立） |
| `A4` 失败 | 其它插件声明了更大的 `order`；调大本包的 `order` 后重启 |
| `C4` 只有 `verify-local` 记录 | 这些是脚本自检写的，不算真机证据；去界面里跑一次 |

### 参数

```powershell
node verify.mjs               # 全量（组合 dump + 安装 + 探针 + 证据）
node verify.mjs --skip-dump   # 不依赖 dsh 源码，离线检查
node verify.mjs --evidence-only
$env:DSH_PROFILE = 'web'                          # 指定 dump 用的 profile（默认 web）
$env:DSH_SOURCE  = 'D:\electron\deepseek-harness' # 指定源码位置
```

退出码：A/B/C 有任一项失败为 1；仅 `C4` 待完成时为 0。

### 证据文件

`<DSH_HOME>/dawei-mode/evidence.jsonl`（默认 `C:\Users\<你>\.dsh\dawei-mode\evidence.jsonl`），每次探针调用追加一行：

```json
{"marker":"DAWEI-MODE-OK","mode":"dawei","sessionId":"session-xxxxxxxx","timestamp":"2026-11-05T14:14:22.301Z","tool":"dawei_probe"}
```

`sessionId` 为 `verify-local` 的行来自脚本自检，不计入 `C4`。

---

## 自定义

改 `cordis.patch.yml` 即可，无需重新构建：

| 想改什么 | 改哪里 |
|---|---|
| 中文名 / 描述 | `config.name` / `config.description` |
| 列表位置 | `config.order`（数值越大越靠后） |
| 人格与自检协议 | `persona.config.prefix` |
| 工具底座 | `plugins` 下的子行，参考 `packages/bundle/web-app/presets/minimal.patch.yml` |
| 探针标记 / 证据格式 | `index.js` 的 `MARKER` 与 `execute` 里的 JSON |

改完后重启客户端重新组合；`index.js` 走 `link:` 安装时无需重装依赖。

## 常见问题

**会话报 `Authentication Fails (invalid dsh token)` / `ACCOUNT_TOKEN_INVALID`**

这不是本插件的问题，是模型凭证失效。如果装了 `deepseek-harness-login` 这类本地登录插件，它会写入 `dsh-local-…` 的假 token，而模型请求仍打向 `api.deepseek.com`，必然 401。处理：把 profile 补丁里 `agent-default-model` 的 `provider` 改为 `deepseek-official`（走真实 `DEEPSEEK_API_KEY`），或恢复真实账号登录。

## 已知边界

- `desktop` profile 只能由 Electron 应用启动，`--dump-config` 等 CLI 诊断对它不可用；装配验证用同构的 `web` profile + 本包补丁叠加完成。
- 模式排序只依赖 `order` 数值；若其它插件也声明了大于 1000 的预设，需要同步调高本包。
- 探针证据写在 `DSH_HOME` 下，切换 `DSH_HOME` 或多 profile 使用时，证据会分别落在各自目录。
- 本包使用 `!!js` 平台判断来选择 pwsh / bash 终端，与内置极简模式一致；若上游收紧第三方 bundle 的 `!!js` 策略，需要改成无条件的单一终端行。
- 每个 profile 需单独安装；装到 `desktop` 不会自动出现在 `web` profile 的模式列表。
