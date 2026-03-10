Set-Location 'C:\Users\bigey\Documents\Antigravity\L2C'

$env:PORT     = '3004'
$env:BASE_URL = 'http://localhost:3004'

$start   = Get-Date
$logFile = 'test-reports\2026-03-09_2135_p0\e2e-full.log'
$sumFile = 'test-reports\2026-03-09_2135_p0\summary.txt'

'=' * 60 | Out-File $logFile -Encoding UTF8
"[21:35:06] P0 冒烟测试  开始: $start" | Out-File $logFile -Append -Encoding UTF8
'Playwright webServer 将自动启动 standalone 服务（port 3004）' | Out-File $logFile -Append -Encoding UTF8
'=' * 60 | Out-File $logFile -Append -Encoding UTF8

# 构建参数数组（splatting 方式安全传递含 | 的 grep 值）
$playwrightArgs = @(
    'exec', 'playwright', 'test', 'e2e/flows/',
    '--project=chromium',
    '--project=firefox',
    '--project=Mobile Chrome',
    '--reporter=list'
)
if ('--grep' -ne '') {
    $playwrightArgs += '--grep'
    $playwrightArgs += 'P0|DO-'
}

& pnpm @playwrightArgs 2>&1 | Tee-Object -FilePath $logFile -Append

$exitCode = $LASTEXITCODE
$end      = Get-Date
$elapsed  = $end - $start

$summary  = "=============================="
$summary += "
E2E P0 冒烟测试 摘要"
$summary += "
开始 : $start"
$summary += "
结束 : $end"
$summary += "
耗时 : $($elapsed.ToString('hh\:mm\:ss'))"
$summary += "
退出码: $exitCode"
$summary += "
状态 : $(if ($exitCode -eq 0) { '✅ 全部通过' } else { '❌ 存在失败' })"
$summary += "
日志 : $logFile"
$summary += "
=============================="

$summary | Out-File $sumFile -Encoding UTF8
$summary | Out-File $logFile -Append -Encoding UTF8

if ($exitCode -eq 0) { [Console]::Beep(880,300); Start-Sleep -Milliseconds 100; [Console]::Beep(1108,500) }
else                  { [Console]::Beep(440,500); Start-Sleep -Milliseconds 100; [Console]::Beep(330,500) }
