# 清理项目根目录的日志文件
# 使用方法:
#   列出所有日志文件: .\cleanup-logs.ps1
#   删除所有日志文件: .\cleanup-logs.ps1 -Execute

param(
    [switch]$Execute
)

$logFiles = Get-ChildItem -Path "." -File -Filter "*.log"

if ($logFiles.Count -eq 0) {
    Write-Host "✅ 没有找到 .log 文件" -ForegroundColor Green
    exit 0
}

Write-Host "找到 $($logFiles.Count) 个日志文件:" -ForegroundColor Yellow
$logFiles | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length / 1KB, 2)) KB)" -ForegroundColor Gray
}

if ($Execute) {
    Write-Host "`n正在删除日志文件..." -ForegroundColor Yellow
    $logFiles | Remove-Item -Force
    Write-Host "✅ 已删除 $($logFiles.Count) 个日志文件" -ForegroundColor Green
} else {
    Write-Host "`n💡 提示: 运行 .\cleanup-logs.ps1 -Execute 来删除这些文件" -ForegroundColor Cyan
}
