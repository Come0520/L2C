# 深度扫描脚本 - 安全、文档、性能指标
$featuresPath = "src/features"
$docsPath = "docs/02-requirements/modules"
$modules = Get-ChildItem -Path $featuresPath -Directory

Write-Output "=== DEEP SCAN RESULTS ==="
Write-Output "模块名|Zod校验|tenantId过滤|审计日志|logger使用|需求文档|分页实现|组件文件(.tsx)|ts-ignore数"

foreach ($mod in $modules) {
    $name = $mod.Name
    $allTsFiles = Get-ChildItem -Path $mod.FullName -File -Recurse -Include '*.ts', '*.tsx' -ErrorAction SilentlyContinue
    $prodFiles = $allTsFiles | Where-Object { $_.Name -notmatch '\.test\.|\.spec\.' }
    
    $zodCount = 0; $tenantCount = 0; $auditCount = 0; $loggerCount = 0; $paginateCount = 0; $tsIgnore = 0
    foreach ($f in $prodFiles) {
        $content = Get-Content -Path $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            if ($content -match 'z\.object|zod|Schema') { $zodCount++ }
            if ($content -match 'tenantId') { $tenantCount++ }
            if ($content -match 'AuditService|auditLog|audit') { $auditCount++ }
            if ($content -match 'logger\.|logger\(') { $loggerCount++ }
            if ($content -match 'pagination|paginate|LIMIT|offset|skip|take') { $paginateCount++ }
            $tsIgnore += ([regex]::Matches($content, 'ts-ignore|ts-expect-error')).Count
        }
    }
    
    # TSX (UI component) count
    $tsxCount = ($prodFiles | Where-Object { $_.Name -match '\.tsx$' } | Measure-Object).Count
    
    # Requirements doc check
    $hasDoc = Test-Path (Join-Path "docs/02-requirements/modules" "${name}.md")
    if (-not $hasDoc) {
        $hasDoc = (Get-ChildItem -Path "docs/02-requirements" -File -Recurse -Filter "*${name}*" -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
    }
    
    Write-Output "${name}|${zodCount}|${tenantCount}|${auditCount}|${loggerCount}|${hasDoc}|${paginateCount}|${tsxCount}|${tsIgnore}"
}
