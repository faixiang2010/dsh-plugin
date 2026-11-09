# 安装后在 DSH「插件」页面手动开启/关闭 dwh-simple-loop。
# install：安装/更新，首次默认关闭；on/off：离线改开关，随后重启 DSH。
param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'on', 'off', 'status')]
    [string]$Action = 'status',
    [string]$ProfileName = 'desktop',
    [string]$ProfileDir = ''
)
$ErrorActionPreference = 'Stop'
$PluginName = 'dwh-simple-loop'
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($ProfileDir)) {
    $ProfileDir = Join-Path $env:USERPROFILE ".dsh\profiles\$ProfileName"
}
$ProfileDir = [IO.Path]::GetFullPath($ProfileDir)
$ManifestPath = Join-Path $ProfileDir 'package.json'
$MarketStatePath = Join-Path $ProfileDir '.dsh-market\state.json'
$VendorDir = Join-Path $ProfileDir "vendor\$PluginName"
$LinkPath = Join-Path $ProfileDir "node_modules\$PluginName"
$DependencySpec = "link:./vendor/$PluginName"
if (-not (Test-Path -LiteralPath $ManifestPath)) { throw "找不到 profile：$ManifestPath" }
$manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($null -eq $manifest.dsh) { $manifest | Add-Member dsh ([pscustomobject]@{}) }
if ($null -eq $manifest.dsh.profile) { $manifest.dsh | Add-Member profile ([pscustomobject]@{}) }
$bundles = @($manifest.dsh.profile.bundles | Where-Object { $_ })
$enabled = $bundles -contains $PluginName
$spec = if ($manifest.dependencies) { $manifest.dependencies.$PluginName } else { $null }

# dshmarket 把每个 bundle 的开关另存为 .dsh-market/state.json 的 disabled 列表，并在每次启动时
# 据此禁用对应插件行。本插件的 patch 会关闭内置 agent-loop；若 bundles 已启用而该记录仍是
# “禁用”，启动时自定义 loop 被关掉、内置 loop 又已被 patch 关闭，就没有任何 agent factory
# （新建会话报 no agent factory registered）。所以开关必须同时改这两处。
function Sync-MarketSwitch([string]$Name, [bool]$Disabled) {
    if (-not (Test-Path -LiteralPath $MarketStatePath)) {
        Write-Host "未找到市场状态文件，跳过同步：$MarketStatePath"
        return
    }
    $state = Get-Content -LiteralPath $MarketStatePath -Raw -Encoding UTF8 | ConvertFrom-Json
    $list = @($state.disabled | Where-Object { $_ -and $_ -ne $Name })
    if ($Disabled) { $list = @($list) + $Name }
    $state | Add-Member -NotePropertyName disabled -NotePropertyValue @($list) -Force
    [IO.File]::WriteAllText($MarketStatePath, ($state | ConvertTo-Json -Compress -Depth 30), (New-Object Text.UTF8Encoding($false)))
    Write-Host "市场开关记录：$Name -> $(if ($Disabled) { '关闭' } else { '开启' })"
}

if ($Action -eq 'status') {
    Write-Host "profile : $ProfileDir"
    Write-Host "依赖    : $spec"
    Write-Host "界面状态: $(if ($enabled) { '开启' } else { '关闭' })（磁盘配置；运行状态以 DSH 为准）"
    $marketDisabled = $false
    if (Test-Path -LiteralPath $MarketStatePath) {
        $marketDisabled = @((Get-Content -LiteralPath $MarketStatePath -Raw -Encoding UTF8 | ConvertFrom-Json).disabled) -contains $PluginName
    }
    Write-Host "市场记录: $(if ($marketDisabled) { '关闭' } else { '开启' })"
    Write-Host "文件    : $(if (Test-Path -LiteralPath (Join-Path $LinkPath 'index.js')) { '存在' } else { '未安装或链接失效，请执行 install' })"
    return
}

if ($Action -in @('install', 'on')) {
    # 仅更新本插件列出的文件，不递归删除目录、日志或不明归属文件。
    $files = @('package.json', 'index.js', 'agent.js', 'cordis.patch.yml', 'README.md')
    foreach ($file in $files) {
        if (-not (Test-Path -LiteralPath (Join-Path $SourceDir $file))) { throw "缺少源文件：$file" }
    }
    if ([IO.Path]::GetFullPath($SourceDir) -eq [IO.Path]::GetFullPath($VendorDir)) {
        throw '请从项目源码目录运行安装脚本。'
    }
    if (Test-Path -LiteralPath $VendorDir) {
        if ((Get-Item -LiteralPath $VendorDir -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "vendor 目录不能是链接：$VendorDir"
        }
    }
    New-Item -ItemType Directory -Force -Path $VendorDir | Out-Null
    foreach ($file in $files) {
        Copy-Item -LiteralPath (Join-Path $SourceDir $file) -Destination (Join-Path $VendorDir $file) -Force
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LinkPath) | Out-Null
    # Directory.Delete(path) 不递归，仅移除 junction 本身；不跨 shell 删除。
    $linkEntry = Get-Item -LiteralPath $LinkPath -Force -ErrorAction SilentlyContinue
    if ($null -ne $linkEntry) {
        if ($linkEntry.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            [IO.Directory]::Delete($LinkPath)
        } else {
            throw "已有实体目录，已保留，请先检查归属：$LinkPath"
        }
    }
    New-Item -ItemType Junction -Path $LinkPath -Target $VendorDir | Out-Null
    if ($null -eq $manifest.dependencies) { $manifest | Add-Member dependencies ([pscustomobject]@{}) }
    $manifest.dependencies | Add-Member -NotePropertyName $PluginName -NotePropertyValue $DependencySpec -Force
}

if ($Action -eq 'on') { $bundles = @($bundles | Where-Object { $_ -ne $PluginName }) + $PluginName }
if ($Action -eq 'off') { $bundles = @($bundles | Where-Object { $_ -ne $PluginName }) }
$manifest.dsh.profile | Add-Member -NotePropertyName bundles -NotePropertyValue @($bundles) -Force
[IO.File]::WriteAllText($ManifestPath, ($manifest | ConvertTo-Json -Depth 30), (New-Object Text.UTF8Encoding($false)))
Sync-MarketSwitch $PluginName (-not (@($bundles) -contains $PluginName))
Write-Host "已处理：$Action；profile：$ProfileDir"
Write-Host '完全退出并重新打开 DSH 一次以装载此版本。之后可直接在「插件」页面开关 dwh-simple-loop。'
Write-Host '关闭只停用，不卸载；重新开启时仍能在界面找到插件。'
