$modules = @(
    "quotes", "supply-chain", "leads", "products", "orders", "channels", "after-sales", "service", "customers", "finance",
    "settings", "analytics", "approval", "dashboard", "admin", "notifications", "platform", "sales", "showroom", "auth",
    "pricing", "dispatch", "search", "monitoring", "upload", "billing"
)

$results = @()

foreach ($mod in $modules) {
    $path = "c:\Users\bigey\Documents\Antigravity\L2C\src\features\$mod"
    if (-not (Test-Path $path)) { continue }

    # 使用 Select-String 实现统计
    $anyCount = (Get-ChildItem -Path $path -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "\bany\b" | Measure-Object).Count
    $tsIgnoreCount = (Get-ChildItem -Path $path -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "@ts-ignore" | Measure-Object).Count
    $auditCount = (Get-ChildItem -Path $path -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "AuditService" | Measure-Object).Count
    $loggerCount = (Get-ChildItem -Path $path -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "logger" | Measure-Object).Count
    $todoCount = (Get-ChildItem -Path $path -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "TODO" | Measure-Object).Count
    
    # 统计测试文件
    $testFiles = (Get-ChildItem -Path $path -Filter "*test*" -Recurse | Measure-Object).Count
    
    # 统计组件相关 (Skeleton, ErrorBoundary, memo)
    $skeletonCount = (Get-ChildItem -Path $path -Recurse -File -Include *.tsx | Select-String -Pattern "Skeleton" | Measure-Object).Count
    $memoCount = (Get-ChildItem -Path $path -Recurse -File -Include *.tsx | Select-String -Pattern "memo\(" | Measure-Object).Count
    $tsxFiles = (Get-ChildItem -Path $path -Filter "*.tsx" -Recurse | Measure-Object).Count

    $results += [PSCustomObject]@{
        Module   = $mod
        Any      = $anyCount
        TsIgnore = $tsIgnoreCount
        Audit    = $auditCount
        Logger   = $loggerCount
        TODO     = $todoCount
        Tests    = $testFiles
        Skeleton = $skeletonCount
        Memo     = $memoCount
        TSX      = $tsxFiles
    }
}

# 特殊处理 Taro 小程序
$taroPath = "c:\Users\bigey\Documents\Antigravity\L2C\miniprogram-taro\src"
if (Test-Path $taroPath) {
    $results += [PSCustomObject]@{
        Module   = "miniprogram (taro)"
        Any      = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "\bany\b" | Measure-Object).Count
        TsIgnore = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "@ts-ignore" | Measure-Object).Count
        Audit    = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "AuditService" | Measure-Object).Count
        Logger   = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "logger" | Measure-Object).Count
        TODO     = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.ts, *.tsx | Select-String -Pattern "TODO" | Measure-Object).Count
        Tests    = (Get-ChildItem -Path $taroPath -Filter "*test*" -Recurse | Measure-Object).Count
        Skeleton = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.tsx | Select-String -Pattern "Skeleton" | Measure-Object).Count
        Memo     = (Get-ChildItem -Path $taroPath -Recurse -File -Include *.tsx | Select-String -Pattern "memo\(" | Measure-Object).Count
        TSX      = (Get-ChildItem -Path $taroPath -Filter "*.tsx" -Recurse | Measure-Object).Count
    }
}

$results | ConvertTo-Json | Out-File "c:\Users\bigey\Documents\Antigravity\L2C\tmp\scan_results.json"
$results | Format-Table
