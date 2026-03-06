# ============================================================
# E2E 并行测试运行脚本（独立服务器 + 4 并行批次）
# 
# 使用方法：
#   pwsh scripts/run-e2e-parallel.ps1
#
# 前置条件：
#   1. 已运行 pnpm build:e2e 或 pnpm build
#   2. 已运行 pnpm db:seed:e2e 确保 E2E 测试数据存在
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "🚀 [E2E-Parallel] 启动独立 standalone 服务器..." -ForegroundColor Cyan

# ─── 1. 先启动独立服务器进程（不依附于任何批次）─────────────────
$serverJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location $root
    node scripts/start-e2e-server.mjs
} -ArgumentList $ROOT

Write-Host "⏳ [E2E-Parallel] 等待服务器就绪（10 秒）..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# ─── 2. 检查服务器是否正在运行 ────────────────────────────────────
$testConn = Test-NetConnection -ComputerName localhost -Port 3004 -InformationLevel Quiet 2>$null
if (-not $testConn) {
    Write-Host "⏳ [E2E-Parallel] 服务器尚未就绪，再等 15 秒..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host "✅ [E2E-Parallel] 服务器已就绪，启动 4 个并行批次..." -ForegroundColor Green

# ─── 3. 获取所有 spec 文件并分成 4 批 ──────────────────────────────
$specDir = "$ROOT\e2e\flows"
$allSpecs = Get-ChildItem -Path $specDir -Filter "*.spec.ts" | Select-Object -ExpandProperty FullName | Sort-Object

$total = $allSpecs.Count
$batchSize = [Math]::Ceiling($total / 4)

$batches = @(
    ($allSpecs | Select-Object -First $batchSize),
    ($allSpecs | Select-Object -Skip $batchSize -First $batchSize),
    ($allSpecs | Select-Object -Skip ($batchSize * 2) -First $batchSize),
    ($allSpecs | Select-Object -Skip ($batchSize * 3))
)

$labels = @("A", "B", "C", "D")

Write-Host "📋 [E2E-Parallel] 共 $total 个 spec 文件，分为 4 批并行运行" -ForegroundColor Cyan

# ─── 4. 并行启动 4 个批次 ─────────────────────────────────────────
$jobs = @()
for ($i = 0; $i -lt 4; $i++) {
    $batch = $batches[$i]
    $label = $labels[$i]
    $specList = ($batch | ForEach-Object {
        # 转换为相对路径
        $rel = $_.Replace("$ROOT\", "").Replace("\", "/")
        "`"$rel`""
    }) -join " "
    
    Write-Host "🔧 [Batch-$label] 启动 $($batch.Count) 个 spec..." -ForegroundColor Blue
    
    $job = Start-Job -ScriptBlock {
        param($root, $specList, $label)
        Set-Location $root
        $env:PLAYWRIGHT_WORKERS = "2"
        $env:CI = "1"  # 设置 CI=1 让 Playwright 不再尝试启动新的 web server
        $cmd = "npx playwright test --project=chromium $specList 2>&1"
        Write-Host "🚀 [Batch-$label] 开始执行..."
        Invoke-Expression $cmd
        $exitCode = $LASTEXITCODE
        Write-Host "🏁 [Batch-$label] 完成，退出码: $exitCode"
    } -ArgumentList $ROOT, $specList, $label
    
    $jobs += @{ Job = $job; Label = $label }
}

Write-Host "`n⏳ [E2E-Parallel] 等待所有批次完成..." -ForegroundColor Yellow

# ─── 5. 等待所有批次完成 ──────────────────────────────────────────
$results = @()
foreach ($item in $jobs) {
    $job = $item.Job
    $label = $item.Label
    
    Write-Host "⏳ [Batch-$label] 等待完成..." -ForegroundColor Yellow
    Wait-Job -Job $job | Out-Null
    
    $output = Receive-Job -Job $job
    $exitCode = $job.ChildJobs[0].JobStateInfo.State
    
    Write-Host "`n📊 [Batch-$label] 输出（最后 30 行）:" -ForegroundColor Cyan
    $output | Select-Object -Last 30 | ForEach-Object { Write-Host "  $_" }
    
    $results += @{ Label = $label; ExitCode = $exitCode; Output = $output }
    Remove-Job -Job $job
}

# ─── 6. 关闭服务器 ────────────────────────────────────────────────
Write-Host "`n🛑 [E2E-Parallel] 关闭 standalone 服务器..." -ForegroundColor Red
Stop-Job -Job $serverJob
Remove-Job -Job $serverJob

Write-Host "`n✅ [E2E-Parallel] 全部完成！" -ForegroundColor Green
