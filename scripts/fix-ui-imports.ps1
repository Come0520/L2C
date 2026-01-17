# 批量修复 UI 组件导入路径
# 兼容旧版 PowerShell

$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts
$fixedCount = 0
$pattern = '@/shared/components/ui/'
$replacement = '@/shared/ui/'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Encoding UTF8
    $joined = $content -join "`n"
    
    if ($joined -match [regex]::Escape($pattern)) {
        $newContent = $joined -replace [regex]::Escape($pattern), $replacement
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        Write-Host "✅ $($file.FullName)"
        $fixedCount++
    }
}

Write-Host "`n✨ 修复完成!"
Write-Host "📊 修复文件数: $fixedCount"
