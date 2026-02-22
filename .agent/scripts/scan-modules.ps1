# 模块扫描脚本 - 收集每个模块的关键指标
$featuresPath = "src/features"
$modules = Get-ChildItem -Path $featuresPath -Directory

Write-Output "=== MODULE SCAN RESULTS ==="
Write-Output "模块名|总文件数|测试文件数|TS文件数|any数量(生产)|TODO数量|actions文件|schema文件|service文件|__tests__目录"

foreach ($mod in $modules) {
    $name = $mod.Name
    $allFiles = Get-ChildItem -Path $mod.FullName -File -Recurse -ErrorAction SilentlyContinue
    $totalFiles = ($allFiles | Measure-Object).Count
    $testFiles = ($allFiles | Where-Object { $_.Name -match '\.test\.|\.spec\.' } | Measure-Object).Count
    $tsFiles = ($allFiles | Where-Object { $_.Name -match '\.(ts|tsx)$' } | Measure-Object).Count
    
    # any count in production files
    $anyCount = 0
    $prodFiles = $allFiles | Where-Object { $_.Name -match '\.(ts|tsx)$' -and $_.Name -notmatch '\.test\.|\.spec\.' }
    foreach ($f in $prodFiles) {
        $matches = Select-String -Path $f.FullName -Pattern ': any\b|as any' -ErrorAction SilentlyContinue
        $anyCount += ($matches | Measure-Object).Count
    }
    
    # TODO count
    $todoCount = 0
    foreach ($f in ($allFiles | Where-Object { $_.Name -match '\.(ts|tsx)$' })) {
        $matches = Select-String -Path $f.FullName -Pattern 'TODO|FIXME|HACK' -ErrorAction SilentlyContinue
        $todoCount += ($matches | Measure-Object).Count
    }
    
    # Architecture checks
    $hasActions = (Get-ChildItem -Path $mod.FullName -File -Recurse -Filter '*actions*' -ErrorAction SilentlyContinue | Measure-Object).Count
    $hasSchema = (Get-ChildItem -Path $mod.FullName -File -Recurse -Filter '*schema*' -ErrorAction SilentlyContinue | Measure-Object).Count
    $hasService = (Get-ChildItem -Path $mod.FullName -File -Recurse -Filter '*service*' -ErrorAction SilentlyContinue | Measure-Object).Count
    $hasTests = Test-Path (Join-Path $mod.FullName "__tests__")
    
    Write-Output "${name}|${totalFiles}|${testFiles}|${tsFiles}|${anyCount}|${todoCount}|${hasActions}|${hasSchema}|${hasService}|${hasTests}"
}
