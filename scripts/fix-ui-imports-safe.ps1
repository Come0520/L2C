# 安全的批量替换脚本 - 仅替换导入语句中的路径

$pattern = "from '@/shared/components/ui/"
$replacement = "from '@/shared/ui/"
$fixedCount = 0

Get-ChildItem -Path "src" -Recurse -Include *.tsx, *.ts | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    
    if ($content.Contains($pattern)) {
        $newContent = $content.Replace($pattern, $replacement)
        [System.IO.File]::WriteAllText($_.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "✅ $($_.FullName)"
        $fixedCount++
    }
}

Write-Host "`n✨ 修复完成!"
Write-Host "📊 修复文件数: $fixedCount"
