# 批量替换 console.error/log/warn 为 createLogger 结构化日志
# 适用于 src/app/api/mobile 下的路由文件

$mobileDir = "c:\Users\bigey\Documents\Antigravity\L2C\src\app\api\mobile"

# 路由名称提取函数：从路径中推导路由名
function Get-RouteName {
    param([string]$filePath)
    $rel = $filePath.Replace($mobileDir, "").Replace("\", "/").Replace("/route.ts", "")
    if ($rel.StartsWith("/")) { $rel = $rel.Substring(1) }
    return "mobile/$rel"
}

# 查找所有包含 console.error/log/warn 的路由文件
$files = Get-ChildItem -Path $mobileDir -Recurse -Filter "route.ts" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "console\.(error|log|warn)"
}

Write-Host "找到 $($files.Count) 个需要修改的路由文件" -ForegroundColor Cyan

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $routeName = Get-RouteName $file.FullName
    $modified = $false

    Write-Host "`n处理: $routeName" -ForegroundColor Yellow

    # 1. 检查是否已有 createLogger 导入
    if ($content -notmatch "import.*createLogger.*from") {
        # 添加 createLogger 导入 - 在第一个 import 之前或现有 import 块末尾
        $importLine = "import { createLogger } from '@/shared/lib/logger';"
        
        # 查找最后一个 import 语句的位置
        $lines = $content -split "`r?`n"
        $lastImportIdx = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import ") {
                $lastImportIdx = $i
            }
        }

        if ($lastImportIdx -ge 0) {
            # 在最后一个 import 后面插入
            $newLines = [System.Collections.ArrayList]::new($lines)
            $newLines.Insert($lastImportIdx + 1, $importLine)
            $content = $newLines -join "`r`n"
            $modified = $true
            Write-Host "  + 添加 createLogger 导入" -ForegroundColor Green
        }
    }

    # 2. 检查是否已有 log = createLogger() 实例
    if ($content -notmatch "const log = createLogger") {
        # 找到第一个 export (async )?function 的位置并在前面插入
        $lines = $content -split "`r?`n"
        $firstExportIdx = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^export (async )?function") {
                $firstExportIdx = $i
                break
            }
        }

        if ($firstExportIdx -ge 0) {
            $logInstance = "const log = createLogger('$routeName');"
            $newLines = [System.Collections.ArrayList]::new($lines)
            $newLines.Insert($firstExportIdx, $logInstance)
            $newLines.Insert($firstExportIdx, "")
            $content = $newLines -join "`r`n"
            $modified = $true
            Write-Host "  + 添加 log 实例: $logInstance" -ForegroundColor Green
        }
    }

    # 3. 替换 console.error 调用
    # 模式: console.error('消息:', error) -> log.error('消息', {}, error)
    # 模式: console.error('消息:', { error, ... }) -> log.error('消息', { ... }, error)
    
    # 简单模式: console.error('msg', error);
    $content = [regex]::Replace($content, 
        "console\.error\('([^']+?)[:,]?\s*'\s*,\s*error\)",
        "log.error('`$1', {}, error)")
    
    # 带对象上下文: console.error('msg', { error, key: val })
    $content = [regex]::Replace($content,
        "console\.error\('([^']+?)[:,]?\s*'\s*,\s*\{([^}]*)\}\)",
        "log.error('`$1', {`$2})")

    # 带变量数据: console.error('msg', wxData)
    $content = [regex]::Replace($content,
        "console\.error\('([^']+?)[:,]?\s*'\s*,\s*([a-zA-Z_]\w+)\)",
        "log.error('`$1', {}, `$2)")

    # 带 JSON.stringify: console.error('[API] Validation failed:', JSON.stringify(...))
    $content = [regex]::Replace($content,
        "console\.error\('([^']+?)[:,]?\s*'\s*,\s*(JSON\.stringify\([^)]+\))\)",
        "log.error('`$1', { detail: `$2 })")

    # 4. 替换 console.log 调用
    $content = [regex]::Replace($content,
        "console\.log\(`([^`]+)`\)",
        "log.info('`$1')")
    
    # 5. 替换 console.warn 调用
    $content = [regex]::Replace($content,
        "console\.warn\(`([^`]+)`\)",
        "log.warn('`$1')")

    # 写回文件
    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding utf8
    Write-Host "  ✓ 替换完成" -ForegroundColor Green
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "所有文件处理完毕！" -ForegroundColor Green
