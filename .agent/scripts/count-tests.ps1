# 测试用例计数脚本
$featuresPath = "src/features"
$modules = Get-ChildItem -Path $featuresPath -Directory

foreach ($mod in $modules) {
    $name = $mod.Name
    $testDir = Join-Path $mod.FullName "__tests__"
    $testCount = 0
    if (Test-Path $testDir) {
        $testFiles = Get-ChildItem -Path $testDir -File -Recurse -Include '*.test.ts', '*.test.tsx' -ErrorAction SilentlyContinue
        foreach ($f in $testFiles) {
            $tc = (Select-String -Path $f.FullName -Pattern "it\(|test\(" -ErrorAction SilentlyContinue | Measure-Object).Count
            $testCount += $tc
        }
    }
    Write-Output "${name}|${testCount}"
}
