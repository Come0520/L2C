#!/bin/bash
set -e

echo "==========================="
echo "开始热修复服务器环境"
echo "==========================="

echo "1. 执行本地代码构建 (这将更新 .next 产物)..."
pnpm run build

echo "2. 临时修改 .dockerignore，允许上传 .next 构建产物..."
DOCKERIGNORE_PATH=".dockerignore"
if grep -q "^\.next$" "$DOCKERIGNORE_PATH"; then
    sed -i '/^\.next$/d' "$DOCKERIGNORE_PATH"
    echo "已临时移除 .dockerignore 中的 .next 规则"
    RESTORE_DOCKERIGNORE=true
else
    RESTORE_DOCKERIGNORE=false
fi

echo "3. 使用新产物重建 Docker 镜像..."
if ! docker-compose -f docker-compose.prod.yml build --no-cache app; then
    echo "Docker build 失败"
    # 失败也需要恢复 .dockerignore
    if [ "$RESTORE_DOCKERIGNORE" = true ]; then
        echo ".next" >> "$DOCKERIGNORE_PATH"
        echo "已恢复 .dockerignore 中的 .next 规则"
    fi
    exit 1
fi

echo "4. 重启线上服务..."
docker-compose -f docker-compose.prod.yml up -d

echo "5. 恢复 .dockerignore..."
if [ "$RESTORE_DOCKERIGNORE" = true ]; then
    echo ".next" >> "$DOCKERIGNORE_PATH"
    echo "已恢复 .dockerignore 中的 .next 规则"
fi

echo "==========================="
echo "热修复完成！请再次通过浏览器测试。"
echo "==========================="
