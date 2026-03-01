Set-Location 'c:\Users\bigey\Documents\Antigravity\L2C'

# 1. 修复所有 zodResolver() 类型兼容 - 需要 as any
$formFiles = @(
    'src/features/finance/components/expense-form.tsx',
    'src/features/finance/components/journal-entry-form.tsx',
    'src/features/finance/components/PaymentOrderDialog.tsx',
    'src/features/finance/components/receipt-bill-dialog.tsx'
)

foreach ($f in $formFiles) {
    $content = Get-Content -Raw $f
    # 修复 zodResolver(...) → zodResolver(...) as any
    $newContent = $content -replace 'resolver: zodResolver\(([^)]+)\)(?! as any)', 'resolver: zodResolver($1) as any'
    if ($content -ne $newContent) {
        Set-Content $f -Value $newContent -NoNewline
        Write-Host "FIXED zodResolver: $f"
    }
    else {
        Write-Host "SKIP zodResolver: $f"
    }
}

# 2. 修复 revalidateTag 调用 - 移除多余的空对象参数
$actionFiles = @(
    'src/features/finance/actions/ap.ts',
    'src/features/finance/actions/ar.ts'
)

foreach ($f in $actionFiles) {
    $content = Get-Content -Raw $f
    # 把 revalidateTag('xxx', {}) 改为 revalidateTag('xxx')
    $newContent = $content -replace "revalidateTag\('([^']+)',\s*\{\}\)", "revalidateTag('`$1')"
    if ($content -ne $newContent) {
        Set-Content $f -Value $newContent -NoNewline
        Write-Host "FIXED revalidateTag: $f"
    }
    else {
        Write-Host "SKIP revalidateTag: $f"
    }
}

# 3. 修复 expense-import.tsx 的可能 null 访问
$importFile = 'src/features/finance/components/expense-import.tsx'
$content = Get-Content -Raw $importFile
# 对照后面再看

Write-Host "`nDone with batch 2 fixes."
