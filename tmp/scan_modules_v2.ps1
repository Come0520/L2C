$modules = @(
    "quotes", "supply-chain", "leads", "products", "orders", "channels", "after-sales", "service", "customers", "finance",
    "settings", "analytics", "approval", "dashboard", "admin", "notifications", "platform", "sales", "showroom", "auth",
    "pricing", "dispatch", "search", "monitoring", "upload", "billing"
)

$results = @()

foreach ($mod in $modules) {
    $path = "c:\Users\bigey\Documents\Antigravity\L2C\src\features\$mod"
    if (-not (Test-Path $path)) { continue }

    # 递归获取所有相关代码文件
    $files = Get-ChildItem -Path $path -Recurse -File -Include *.ts, *.tsx
    
    $anyCount = 0
    $tsIgnoreCount = 0
    $auditCount = 0
    $loggerCount = 0
    $todoCount = 0
    $skeletonCount = 0
    $memoCount = 0

    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($null -eq $content) { continue }
        
        # 使用正则进行精确统计
        $anyCount += ([regex]::Matches($content, "\bany\b")).Count
        $tsIgnoreCount += ([regex]::Matches($content, "@ts-ignore|@ts-expect-error")).Count
        $auditCount += ([regex]::Matches($content, "AuditService")).Count
        $loggerCount += ([regex]::Matches($content, "logger")).Count
        $todoCount += ([regex]::Matches($content, "TODO|FIXME")).Count
        
        if ($file.Extension -eq ".tsx") {
            $skeletonCount += ([regex]::Matches($content, "Skeleton")).Count
            $memoCount += ([regex]::Matches($content, "memo\(")).Count
        }
    }
    
    # 统计测试文件
    $testFiles = (Get-ChildItem -Path $path -Filter "*test*" -Recurse | Measure-Object).Count
    $tsxCount = (Get-ChildItem -Path $path -Filter "*.tsx" -Recurse | Measure-Object).Count

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
        TSX      = $tsxCount
    }
}

# 特殊处理 Taro 小程序
$taroPath = "c:\Users\bigey\Documents\Antigravity\L2C\miniprogram-taro\src"
if (Test-Path $taroPath) {
    $tFiles = Get-ChildItem -Path $taroPath -Recurse -File -Include *.ts, *.tsx
    $tAny = 0; $tIgnore = 0; $tAudit = 0; $tLogger = 0; $tTodo = 0; $tSkeleton = 0; $tMemo = 0
    
    foreach ($f in $tFiles) {
        $c = Get-Content $f.FullName -Raw
        if ($null -eq $c) { continue }
        $tAny += ([regex]::Matches($c, "\bany\b")).Count
        $tIgnore += ([regex]::Matches($c, "@ts-ignore|@ts-expect-error")).Count
        $tAudit += ([regex]::Matches($c, "AuditService")).Count
        $tLogger += ([regex]::Matches($c, "logger")).Count
        $tTodo += ([regex]::Matches($c, "TODO|FIXME")).Count
        if ($f.Extension -eq ".tsx") {
            $tSkeleton += ([regex]::Matches($c, "Skeleton")).Count
            $tMemo += ([regex]::Matches($c, "memo\(")).Count
        }
    }

    $results += [PSCustomObject]@{
        Module   = "miniprogram (taro)"
        Any      = $tAny
        TsIgnore = $tIgnore
        Audit    = $tAudit
        Logger   = $tLogger
        TODO     = $tTodo
        Tests    = (Get-ChildItem -Path $taroPath -Filter "*test*" -Recurse | Measure-Object).Count
        Skeleton = $tSkeleton
        Memo     = $tMemo
        TSX      = (Get-ChildItem -Path $taroPath -Filter "*.tsx" -Recurse | Measure-Object).Count
    }
}

$results | ConvertTo-Json | Out-File "c:\Users\bigey\Documents\Antigravity\L2C\tmp\scan_results.json"
$results | Format-Table
