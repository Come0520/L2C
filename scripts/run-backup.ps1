# L2C 数据库备份脚本
# 用于 Windows 定时任务调用

Set-Location "C:\Users\bigey\Documents\Antigravity\L2C"
$env:NODE_ENV = "production"

# 设置日志文件
$logFile = "backups\backup.log"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 执行备份
Write-Output "[$timestamp] 开始执行备份..." | Out-File -Append $logFile
try {
    pnpm tsx scripts/db-backup.ts 2>&1 | Out-File -Append $logFile
    Write-Output "[$timestamp] 备份完成" | Out-File -Append $logFile
} catch {
    Write-Output "[$timestamp] 备份失败: $_" | Out-File -Append $logFile
}
