# 验收脚本 - Subagent 9-13
param([string[]]$Modules = @("sales", "after-sales", "quotes", "orders", "service"))

$root = "c:\Users\bigey\Documents\Antigravity\L2C"

foreach ($mod in $Modules) {
    $modPath = "$root\src\features\$mod"
    if (-not (Test-Path $modPath)) { continue }

    $allSrc = Get-ChildItem -Path $modPath -Recurse -File -Include "*.ts", "*.tsx" | Where-Object { $_.Name -notmatch '\.(test|spec)\.' }
    $testFiles = Get-ChildItem -Path $modPath -Recurse -File | Where-Object { $_.Name -match '\.(test|spec)\.' }

    $anyCount = 0; $srcLines = 0; $testLines = 0; $testCases = 0
    $jsdoc = 0; $logs = 0; $audit = 0; $cache = 0

    foreach ($f in $allSrc) {
        $c = Get-Content $f.FullName -Raw -EA SilentlyContinue
        $srcLines += (Get-Content $f.FullName -EA SilentlyContinue | Measure-Object -Line).Lines
        if ($c) {
            $anyCount += ([regex]::Matches($c, ':\s*any\b|as\s+any\b')).Count
            $jsdoc += ([regex]::Matches($c, '/\*\*')).Count
            $logs += ([regex]::Matches($c, 'console\.\w+|logger\.\w+')).Count
            $audit += ([regex]::Matches($c, 'AuditService|auditLog')).Count
            $cache += ([regex]::Matches($c, 'unstable_cache|revalidate')).Count
        }
    }
    foreach ($f in $testFiles) {
        $c = Get-Content $f.FullName -Raw -EA SilentlyContinue
        $testLines += (Get-Content $f.FullName -EA SilentlyContinue | Measure-Object -Line).Lines
        if ($c) { $testCases += ([regex]::Matches($c, '\bit\s*\(|test\s*\(')).Count }
    }

    $ratio = if ($srcLines -gt 0) { [math]::Round($testLines / $srcLines * 100, 1) } else { 0 }

    Write-Output "[$mod] src:$srcLines行 | tests:$($testFiles.Count)文件,$testCases用例,$ratio% | any:$anyCount | jsdoc:$jsdoc | log:$logs | audit:$audit | cache:$cache"
}
