#!/bin/bash
# ============================================================
# L2C 快速回滚脚本
# 用法: bash scripts/rollback.sh
#
# 原理: 将 ECS 上最近一次备份的产物 (next-build-backup-*.tar.gz)
#       重新解压并重建 Docker 镜像，实现约 2 分钟内版本回滚。
#
# 前提: 上次部署时 rollback 脚本已在 ECS 上保留了备份文件。
# ============================================================
set -e

ECS_HOST="root@106.15.43.218"
ECS_PROJECT_DIR="/root/L2C"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

echo "==========================================="
echo "   L2C 紧急回滚"
echo "==========================================="

# === 步骤 1: 列出可用备份 ===
log_info "步骤 1/4: 查询 ECS 上的可用备份..."
BACKUPS=$(ssh "$ECS_HOST" "ls -t ${ECS_PROJECT_DIR}/next-build-backup-*.tar.gz 2>/dev/null | head -5" || true)

if [ -z "$BACKUPS" ]; then
  log_error "ECS 上没有找到任何备份文件！无法回滚。"
  exit 1
fi

echo ""
log_warn "可用备份（最新优先）:"
echo "$BACKUPS" | nl -ba
echo ""

# === 步骤 2: 选择备份 ===
LATEST=$(echo "$BACKUPS" | head -1 | xargs basename)
read -p "按回车使用最新备份 [${LATEST}]，或输入备份文件名: " CHOSEN
CHOSEN="${CHOSEN:-$LATEST}"
log_info "将使用备份: $CHOSEN"

# 二次确认
read -p "⚠️  确认回滚？当前版本将被替换。(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log_warn "回滚已取消。"
  exit 0
fi

# === 步骤 3: 远程回滚 ===
log_info "步骤 3/4: 在 ECS 上执行回滚..."
ssh "$ECS_HOST" bash -s << REMOTE_SCRIPT
set -e
cd ${ECS_PROJECT_DIR}

echo "→ 解压备份产物: ${CHOSEN}"
rm -rf .next/standalone .next/static
tar -xzf "${CHOSEN}"

# 临时解除 .dockerignore 中的 .next 规则
sed -i '/^\.next$/d' .dockerignore

echo "→ 重建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache app

# 恢复 .dockerignore
echo ".next" >> .dockerignore

echo "→ 重启服务..."
docker rm -f l2c-app l2c-db-migrate l2c-nginx 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d

echo "→ ECS 回滚完成，等待服务启动..."
REMOTE_SCRIPT

# === 步骤 4: 验证 ===
log_info "步骤 4/4: 等待 30 秒验证服务状态..."
sleep 30
CONTAINER_STATUS=$(ssh "$ECS_HOST" "docker ps --filter name=l2c-app --format '{{.Status}}'")
log_info "容器状态: $CONTAINER_STATUS"

echo ""
echo "==========================================="
echo "   回滚完成！"
echo "   已还原至备份: $CHOSEN"
echo "   验证: https://l2c.asia"
echo "==========================================="
