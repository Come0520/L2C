#!/bin/bash
# ============================================================
# ECS 端自动部署脚本 - 由 Webhook 触发
# 功能: 同步 Git 配置文件，解压预构建产物，重建 Docker 镜像
# 日志: /var/log/webhook-deploy.log
# 前提: next-build.tar.gz 已由本地通过 scp 上传至 /root/L2C/
# ============================================================
set -e

LOG_FILE="/var/log/webhook-deploy.log"
PROJECT_DIR="/root/L2C"
TAR_FILE="$PROJECT_DIR/next-build.tar.gz"

# 日志函数（带时间戳）
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "====== 自动部署开始 ======"
log "当前用户: $(whoami)"

cd "$PROJECT_DIR"

# 步骤 1: 同步最新 Git 代码（配置文件、Dockerfile、docker-compose 等）
log "步骤 1: 拉取最新 Git 代码..."
git fetch origin main >> "$LOG_FILE" 2>&1
git reset --hard FETCH_HEAD >> "$LOG_FILE" 2>&1
NEW_SHA=$(git rev-parse --short HEAD)
log "Git 同步完成，当前 SHA: $NEW_SHA"

# 步骤 2: 检查构建产物是否已上传
if [ ! -f "$TAR_FILE" ]; then
  log "ERROR: $TAR_FILE 不存在！请先通过 scp 上传构建产物，再触发 webhook"
  exit 1
fi
log "步骤 2: 构建产物存在 ✓"

# 步骤 3: 备份旧产物包
BACKUP_FILE="$PROJECT_DIR/next-build-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
cp "$TAR_FILE" "$BACKUP_FILE"
log "步骤 3: 旧产物已备份至 $BACKUP_FILE"

# 步骤 4: 解压新产物
log "步骤 4: 解压构建产物..."
rm -rf .next/standalone .next/static
tar -xzf "$TAR_FILE" >> "$LOG_FILE" 2>&1
log "解压完成 ✓"

# 步骤 5: 重建 Docker 镜像（含 db-migrate）
log "步骤 5: 重建 Docker 镜像..."
# 临时允许 .next 目录进入 Docker 构建上下文
sed -i '/^\.next$/d' .dockerignore
docker compose -f docker-compose.prod.yml build --no-cache >> "$LOG_FILE" 2>&1
# 恢复 .dockerignore
echo '.next' >> .dockerignore
log "Docker 构建完成 ✓"

# 步骤 6: 重启所有服务（含 db-migrate）
log "步骤 6: 重启服务..."
docker rm -f l2c-app l2c-db-migrate l2c-nginx 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d >> "$LOG_FILE" 2>&1
log "服务启动完成 ✓"

# 步骤 7: 等待健康检查（start_period=120s）
log "步骤 7: 等待 30 秒进行健康检查..."
sleep 30
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://l2c.asia/ 2>/dev/null || echo "ERROR")
log "健康检查 → HTTP $HTTP_CODE"

# 清理旧备份（仅保留最近 3 个）
ls -t "$PROJECT_DIR"/next-build-backup-*.tar.gz 2>/dev/null | tail -n +4 | xargs rm -f
log "旧备份清理完成（保留最近 3 个）"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "302" ]; then
  log "====== 自动部署成功 ✓ SHA: $NEW_SHA ======"
else
  log "====== ⚠️  警告：健康检查返回 $HTTP_CODE，请手动检查服务 ======"
  exit 1
fi
