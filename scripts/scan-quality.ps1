# 模块代码质量扫描脚本
$featuresPath = "src/features"
$modules = Get-ChildItem -Path $featuresPath -Directory

Write-Output "=== 代码质量指标 ==="
Write-Output "模块|any|TODO/FIXME|console.|ts-ignore/expect-error"
foreach ($mod in $modules) {
    $path = $mod.FullName
    $files = Get-ChildItem -Path $path -Recurse -Include '*.ts','*.tsx' -File | Where-Object { $_.FullName -notmatch '__tests__' }
    
    $anyCount = 0
    $todoCount = 0
    $consoleCount = 0
    $tsIgnoreCount = 0
    
    foreach ($f in $files) {
        $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $anyCount += ([regex]::Matches($content, ': any\b|as any\b')).Count
            $todoCount += ([regex]::Matches($content, 'TODO|FIXME|HACK')).Count
            $consoleCount += ([regex]::Matches($content, 'console\.(log|warn|error|info)')).Count
            $tsIgnoreCount += ([regex]::Matches($content, '@ts-ignore|@ts-expect-error')).Count
        }
    }
    
    Write-Output "$($mod.Name)|$anyCount|$todoCount|$consoleCount|$tsIgnoreCount"
}

Write-Output ""
Write-Output "=== 测试与安全指标 ==="
Write-Output "模块|测试文件数|生产文件数|AuditService|Zod使用|Auth使用"
foreach ($mod in $modules) {
    $path = $mod.FullName
    $testDir = Join-Path $path '__tests__'
    $testFiles = 0
    if (Test-Path $testDir) {
        $testFiles = (Get-ChildItem -Path $testDir -Recurse -Include '*.test.ts','*.test.tsx' -File -ErrorAction SilentlyContinue).Count
    }
    
    $prodFiles = Get-ChildItem -Path $path -Recurse -Include '*.ts','*.tsx' -File | Where-Object { $_.FullName -notmatch '__tests__' }
    $totalProd = $prodFiles.Count
    
    $auditCount = 0
    $zodCount = 0
    $authCount = 0
    
    foreach ($f in $prodFiles) {
        $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $auditCount += ([regex]::Matches($content, 'AuditService')).Count
            $zodCount += ([regex]::Matches($content, 'z\.\w+')).Count
            $authCount += ([regex]::Matches($content, 'requireAuth|getAuthContext|auth\(\)')).Count
        }
    }
    
    Write-Output "$($mod.Name)|$testFiles|$totalProd|$auditCount|$zodCount|$authCount"
}
