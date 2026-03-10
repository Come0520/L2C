Set-Location 'C:\Users\bigey\Documents\Antigravity\L2C'

# [修复 2] 环境变量在启动前设置
$env:PORT     = '3004'
$env:NODE_ENV = 'production'

$start   = Get-Date
$logFile = 'test-reports\2026-03-09_2122_p0\e2e-full.log'
$sumFile = 'test-reports\2026-03-09_2122_p0\summary.txt'

'=' * 60 | Out-File $logFile -Encoding UTF8
"[21:22:15] 🔴 P0 冒烟测试  开始时间: $start" | Out-File $logFile -Append -Encoding UTF8
'=' * 60 | Out-File $logFile -Append -Encoding UTF8

# 启动生产服务器
$server = Start-Process -FilePath 'node' -ArgumentList '.next\standalone\server.js' -PassThru -NoNewWindow
"[服务] 已启动 (PID: $($server.Id)，Port: 3004)" | Out-File $logFile -Append -Encoding UTF8

# [修复 1] 轮询健康检查，最多 60 秒
$ready = $false; $attempts = 0
while (-not $ready -and $attempts -lt 60) {
    Start-Sleep -Seconds 1; $attempts++
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3004" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($r.StatusCode -lt 500) { $ready = $true }
    } catch {}
}

if (-not $ready) {
    "❌ 服务 $attempts 秒内未就绪，终止" | Out-File $logFile -Append -Encoding UTF8
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
"[服务] 就绪！($attempts 秒)  开始测试..." | Out-File $logFile -Append -Encoding UTF8

# 执行测试
$env:BASE_URL = 'http://localhost:3004'
$env:PORT     = '3004'
& pnpm exec playwright test e2e/flows/ --project=chromium --project=firefox '--project=Mobile Chrome' --reporter=list --grep "P0|DO-" 2>&1 |
    Tee-Object -FilePath $logFile -Append

$exitCode = $LASTEXITCODE
$end      = Get-Date
$elapsed  = $end - $start

# 停止服务
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue

# [修复 5] 摘要用双引号 here-string 确保变量展开
$summary = "=============================="
$summary += "
E2E 🔴 P0 冒烟测试 摘要"
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

# 提示音（两音符区分成功/失败）
if ($exitCode -eq 0) { [Console]::Beep(880,300); Start-Sleep -ms 100; [Console]::Beep(1108,500) }
else                  { [Console]::Beep(440,500); Start-Sleep -ms 100; [Console]::Beep(330,500)  }
