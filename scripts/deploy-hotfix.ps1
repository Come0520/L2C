param()

Write-Host "==========================="
Write-Host "开始热修复服务器环境"
Write-Host "==========================="

Write-Host "1. 执行本地代码构建 (这将更新 .next 产物)..."
pnpm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "构建失败，请检查错误。" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "2. 临时修改 .dockerignore，允许上传 .next 构建产物..."
$dockerignorePath = ".\.dockerignore"
$dockerignoreContent = Get-Content $dockerignorePath
if ($dockerignoreContent -contains ".next") {
    $dockerignoreContent = $dockerignoreContent | Where-Object { $_ -ne ".next" }
    Set-Content -Path $dockerignorePath -Value $dockerignoreContent
    Write-Host "已临时移除 .dockerignore 中的 .next 规则"
}

try {
    Write-Host "3. 使用新产物重建 Docker 镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache app
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }

    Write-Host "4. 重启线上服务..."
    docker-compose -f docker-compose.prod.yml up -d
}
finally {
    Write-Host "5. 恢复 .dockerignore..."
    if (!(Get-Content $dockerignorePath -ErrorAction SilentlyContinue | Select-String -Pattern "^\.next$")) {
        Add-Content -Path $dockerignorePath -Value ".next"
        Write-Host "已恢复 .dockerignore 中的 .next 规则"
    }
}

Write-Host "==========================="
Write-Host "热修复完成！请再次通过浏览器测试。" -ForegroundColor Green
Write-Host "==========================="
