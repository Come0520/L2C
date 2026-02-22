# 模块补充数据扫描
$featuresPath = "src/features"
$modules = Get-ChildItem -Path $featuresPath -Directory

Write-Output "模块|组件数|logger使用|tenantId使用"
foreach ($mod in $modules) {
    $path = $mod.FullName
    $compDir = Join-Path $path "components"
    $compCount = 0
    if (Test-Path $compDir) {
        $items = Get-ChildItem -Path $compDir -Recurse -Include "*.tsx" -File -ErrorAction SilentlyContinue
        if ($items) { $compCount = $items.Count }
    }
    
    $loggerCount = 0
    $tenantCount = 0
    $prodFiles = Get-ChildItem -Path $path -Recurse -Include "*.ts", "*.tsx" -File | Where-Object { $_.FullName -notmatch "__tests__" }
    foreach ($f in $prodFiles) {
        $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            $loggerCount += ([regex]::Matches($content, "logger\.")).Count
            $tenantCount += ([regex]::Matches($content, "tenantId")).Count
        }
    }
    
    Write-Output "$($mod.Name)|$compCount|$loggerCount|$tenantCount"
}
