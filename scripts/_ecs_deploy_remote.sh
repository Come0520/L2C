#!/bin/bash
set -e

PROJECT_DIR="/root/L2C"
BACKUP_DIR="/root/backups"
TARBALL="/root/next-build.tar.gz"

echo "=== [1/5] 备份旧产物 ==="
mkdir -p "$BACKUP_DIR"
if [ -d "$PROJECT_DIR/.next" ]; then
    BACKUP_NAME="next-build-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$PROJECT_DIR" .next/standalone .next/static 2>/dev/null || true
    echo "备份完成: $BACKUP_NAME"
fi

echo "=== [2/5] 解压新产物 ==="
tar -xzf "$TARBALL" -C "$PROJECT_DIR"
echo "解压完成"

echo "=== [3/5] 版本校验 ==="
PKG="$PROJECT_DIR/.next/standalone/package.json"
if [ -f "$PKG" ]; then
    VERSION=$(python3 -c "import json; print(json.load(open('$PKG'))['version'])" 2>/dev/null || cat "$PKG" | grep '"version"' | head -1)
    echo "运行时版本: $VERSION"
fi

echo "=== [4/5] docker compose build --no-cache ==="
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml build --no-cache

echo "=== [5/5] docker compose up -d ==="
docker compose -f docker-compose.prod.yml up -d --remove-orphans

sleep 8
echo "=== 容器状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=== 健康检查 ==="
curl -sf http://localhost:3000/api/health && echo "✅ 健康检查通过" || echo "⚠️ 健康检查失败，请检查日志"
