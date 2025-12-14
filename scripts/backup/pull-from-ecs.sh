#!/bin/bash

#############################################
# 从阿里云 ECS 拉取最新数据库备份
# 用途：将生产环境的备份同步到本地，实现"本地冷备"
#############################################

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 配置信息 (与 deploy 脚本保持一致)
ECS_IP="139.196.78.237"
SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"
SSH_USER="root"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
REMOTE_BACKUP_DIR="/opt/l2c/L2C/backups" # 对应 docker-compose 中 db-backup 挂载的目录
LOCAL_BACKUP_DIR="$(pwd)/backups/ecs-production"

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. 准备本地目录
mkdir -p "$LOCAL_BACKUP_DIR"

info "步骤 1/3: 连接 ECS 查找最新备份..."

# 2. 获取远程最新的备份文件名
# 假设备份文件名格式类似: backup_2024-12-14_000000.sql.gz (取决于 postgres-backup-local 镜像的默认命名)
# 我们列出目录所有文件，按时间排序，取最后一个
LATEST_BACKUP_FILE=$(ssh $SSH_OPTS "$SSH_USER@$ECS_IP" "ls -t $REMOTE_BACKUP_DIR/*.sql.gz 2>/dev/null | head -n 1")

if [ -z "$LATEST_BACKUP_FILE" ]; then
    # 尝试查找 .sql 文件 (如果没压缩)
    LATEST_BACKUP_FILE=$(ssh $SSH_OPTS "$SSH_USER@$ECS_IP" "ls -t $REMOTE_BACKUP_DIR/*.sql 2>/dev/null | head -n 1")
    
    if [ -z "$LATEST_BACKUP_FILE" ]; then
        error "在远程目录 $REMOTE_BACKUP_DIR 中未找到备份文件！"
        echo "请检查远程服务器上的备份容器是否正常运行。"
        exit 1
    fi
fi

FILENAME=$(basename "$LATEST_BACKUP_FILE")
info "找到最新备份: $FILENAME"

# 3. 下载文件
info "步骤 2/3: 开始下载..."
scp $SSH_OPTS "$SSH_USER@$ECS_IP:$LATEST_BACKUP_FILE" "$LOCAL_BACKUP_DIR/$FILENAME"

if [ $? -eq 0 ]; then
    success "下载成功！"
else
    error "下载失败"
    exit 1
fi

# 4. 清理本地旧备份 (保留最近 10 个)
info "步骤 3/3: 清理本地旧备份 (保留最近 15 个)..."
cd "$LOCAL_BACKUP_DIR"
ls -t | tail -n +16 | xargs -I {} rm -- {} 2>/dev/null || true

echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  🎉 备份同步完成！                   ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

echo "本地备份路径: $LOCAL_BACKUP_DIR/$FILENAME"
echo "您可以运行 scripts/backup/restore-to-local.sh 将此数据导入本地开发环境。"
