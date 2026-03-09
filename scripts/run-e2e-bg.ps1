#!/usr/bin/env pwsh
# ============================================================
# E2E 全量后台测试脚本（无人值守版）
# 用法：pnpm test:e2e:bg
#
# 启动后立刻返回命令行，测试在后台运行
# 日志路径：test-reports/YYYY-MM-DD_HHMM/e2e-full.log
# 完成后控制台播放提示音和弹出摘要
# ============================================================

$date = Get-Date -Format "yyyy-MM-dd_HHmm"
$reportDir = "test-reports\$date"
$logFile = "$reportDir\e2e-full.log"
$summaryFile = "$reportDir\summary.txt"

# 确保报告目录存在
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

Write-Host "🚀 全量 E2E 测试已在后台启动!" -ForegroundColor Green
Write-Host "📁 日志文件: $logFile" -ForegroundColor Cyan
Write-Host "🔍 实时查看日志: Get-Content $logFile -Wait" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 提示：你可以继续正常工作，测试完成时会自动发出提示音" -ForegroundColor Gray

# 清理可能残留的孤儿 E2E 服务进程
Get-WmiObject Win32_Process -Filter "CommandLine LIKE '%start-e2e-server%'" |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue |
    Where-Object State -eq 'Listen' |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# 在后台新进程中运行全量测试
$job = Start-Job -ScriptBlock {
    param($root, $log, $summary, $rptDir)

    Set-Location $root

    # 开始时间
    $start = Get-Date
    "=" * 60 | Out-File $log -Encoding UTF8
    "E2E 全量测试  开始时间: $start" | Out-File $log -Append -Encoding UTF8
    "=" * 60 | Out-File $log -Append -Encoding UTF8

    # 执行测试，stdout + stderr 全部追加到日志
    & npx playwright test --project=chromium --reporter=list 2>&1 |
        Tee-Object -FilePath $log -Append

    $exitCode = $LASTEXITCODE
    $end = Get-Date
    $elapsed = $end - $start

    # 写入摘要
    $summaryContent = @"
==============================
E2E 全量测试摘要
==============================
开始时间 : $start
结束时间 : $end
总耗时   : $($elapsed.ToString('hh\:mm\:ss'))
退出代码 : $exitCode
日志文件 : $log
报告目录 : $rptDir
==============================
"@
    $summaryContent | Out-File $summary -Encoding UTF8
    $summaryContent | Out-File $log -Append -Encoding UTF8

    return $exitCode
} -ArgumentList (Get-Location).Path, $logFile, $summaryFile, $reportDir

Write-Host "✅ 已提交后台任务 (Job ID: $($job.Id))" -ForegroundColor Green
Write-Host ""
Write-Host "📋 常用命令：" -ForegroundColor White
Write-Host "  实时日志  :  Get-Content '$logFile' -Wait" -ForegroundColor Gray
Write-Host "  查看结果  :  Receive-Job $($job.Id)" -ForegroundColor Gray
Write-Host "  查看状态  :  Get-Job $($job.Id)" -ForegroundColor Gray
Write-Host "  等待完成  :  Wait-Job $($job.Id); Receive-Job $($job.Id)" -ForegroundColor Gray

# 写入便利脚本，供快速查看进度
@"
# 快速查看 E2E 后台测试日志
Get-Content "$logFile" -Wait -Tail 30
"@ | Out-File "test-reports\watch-latest.ps1" -Encoding UTF8

Write-Host ""
Write-Host "👉 快速查看进度:  pwsh test-reports\watch-latest.ps1" -ForegroundColor Cyan

