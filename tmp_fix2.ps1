Set-Location 'c:\Users\bigey\Documents\Antigravity\L2C'

# 1. 修复 expense-form.tsx 中 accounts 少了 code 的问题
$f = 'src/features/finance/components/expense-form.tsx'
$c = Get-Content -Raw $f
$c = $c -replace 'accounts: \{ id: string; name: string \}\[\];', 'accounts: { id: string; name: string; code?: string }[];'
Set-Content $f -Value $c -NoNewline

# 2. 修复 ar.ts 中的 version 更新错误
$f = 'src/features/finance/actions/ar.ts'
$c = Get-Content -Raw $f
$c = $c -replace '\.set\(\{ \.\.\.newValues, version: sql`\$\{arStatements.version\} \+ 1` \}\)', '.set(newValues)'
$c = $c -replace 'eq\(arStatements\.version, originalStatement\.version\)', ''
Set-Content $f -Value $c -NoNewline

# 3. 修复 ap.ts 中剩余的 revalidateTag 参数问题
$f = 'src/features/finance/actions/ap.ts'
$c = Get-Content -Raw $f
$c = $c -replace "revalidateTag\('finance-ap', \{\}\);", "revalidateTag('finance-ap');"
$c = $c -replace "revalidateTag\('([^']+)', \{\}\);", "revalidateTag('`$1');"
$c = $c -replace "revalidateTag\(`([^`]+)`, \{\}\);", "revalidateTag(`` `$1 ``);"
Set-Content $f -Value $c -NoNewline

Write-Host "Done."
