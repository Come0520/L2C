#!/bin/bash

#############################################
# 恢复备份到本地 Supabase
# 用途：将下载的生产环境数据导入本地 Docker 开发环境
#############################################

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR="$(pwd)/backups/ecs-production"
DOCKER_CONTAINER="l2c-supabase-db" 

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. 检查备份目录
if [ ! -d "$BACKUP_DIR" ]; then
    error "备份目录不存在: $BACKUP_DIR"
    echo "请先运行 scripts/backup/pull-from-ecs.sh 下载备份"
    exit 1
fi

# 2. 列出可用备份供选择
echo "📋 可用备份列表:"
ls -lh "$BACKUP_DIR" | grep -E "\.sql(\.gz)?$" | awk '{print $9, "(" $5 ")"}'
echo

# 3. 自动选择最新备份，或允许用户指定
LATEST_FILE=$(ls -t "$BACKUP_DIR" | grep -E "\.sql(\.gz)?$" | head -n 1)

if [ -z "$LATEST_FILE" ]; then
    error "未找到任何备份文件！"
    exit 1
fi

read -p "是否恢复最新备份 ($LATEST_FILE)? [Y/n] " CONFIRM
CONFIRM=${CONFIRM:-Y}

if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    TARGET_FILE="$BACKUP_DIR/$LATEST_FILE"
else
    read -p "请输入要恢复的完整文件名: " TARGET_FILE
    TARGET_FILE="$BACKUP_DIR/$TARGET_FILE"
    if [ ! -f "$TARGET_FILE" ]; then
        error "文件不存在: $TARGET_FILE"
        exit 1
    fi
fi

# 4. 再次确认 (危险操作)
echo
warning "⚠️  警告：此操作将清空本地数据库 ($DOCKER_CONTAINER) 并覆盖为所选备份数据！"
read -p "请输入 'restore' 确认执行: " VERIFY
if [ "$VERIFY" != "restore" ]; then
    echo "操作已取消"
    exit 0
fi

info "步骤 1/2: 准备文件..."

# 如果是 .gz 文件，需要解压或流式传输
IS_GZIP=0
if [[ "$TARGET_FILE" == *.gz ]]; then
    IS_GZIP=1
fi

info "步骤 2/2: 开始恢复 (这可能需要几分钟)..."

# 检查本地容器是否运行
if ! docker ps | grep -q "$DOCKER_CONTAINER"; then
    error "未找到运行中的 $DOCKER_CONTAINER 容器！"
    echo "请确保本地 Supabase 已启动 (npm run supabase:start 或 docker compose up)"
    echo "提示: 本地 Docker 容器可能名字是 l2c-supabase-db，请检查 docker ps"
    exit 1
fi

# 执行恢复
if [ "$IS_GZIP" -eq 1 ]; then
    # 解压并管道传输给 docker exec psql
    gunzip -c "$TARGET_FILE" | docker exec -i "$DOCKER_CONTAINER" psql -U postgres -d postgres
else
     cat "$TARGET_FILE" | docker exec -i "$DOCKER_CONTAINER" psql -U postgres -d postgres
fi

if [ $? -eq 0 ]; then
    echo
    success "恢复完成！"
    echo "本地数据库需已更新为生产环境数据。"
else
    error "恢复过程中出现错误，请检查日志。"
    exit 1
fi
