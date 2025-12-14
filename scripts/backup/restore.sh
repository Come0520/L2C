#!/bin/bash

##############################################################################
# L2C 备份恢复脚本
# 功能: 从备份文件恢复数据库、存储和配置
# 作者: L2C Team
# 版本: 1.0
##############################################################################

set -e

# ==================== 配置区 ====================
BACKUP_ROOT="/data/l2c-backups"
LOG_FILE="${BACKUP_ROOT}/restore.log"

# ==================== 函数定义 ====================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
    exit 1
}

usage() {
    echo "用法: $0 <备份文件路径>"
    echo "示例: $0 /data/l2c-backups/20250104_020000.tar.gz"
    echo "或者: $0 oss://l2c-backups/database-backups/20250104_020000.tar.gz"
    exit 1
}

# ==================== 参数检查 ====================

if [ $# -ne 1 ]; then
    usage
fi

BACKUP_FILE=$1

log "========================================="
log "开始恢复备份"
log "========================================="

# ==================== 1. 获取备份文件 ====================

if [[ $BACKUP_FILE == oss://* ]]; then
    log "从阿里云 OSS 下载备份..."
    BACKUP_NAME=$(basename "$BACKUP_FILE")
    ossutil64 cp "$BACKUP_FILE" "${BACKUP_ROOT}/${BACKUP_NAME}" || error "OSS下载失败"
    BACKUP_FILE="${BACKUP_ROOT}/${BACKUP_NAME}"
    log "✓ OSS下载完成"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "备份文件不存在: $BACKUP_FILE"
fi

log "备份文件: $BACKUP_FILE"
log "文件大小: $(du -sh "$BACKUP_FILE" | cut -f1)"

# ==================== 2. 解压备份 ====================

log "解压备份文件..."
EXTRACT_DIR="${BACKUP_ROOT}/restore_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXTRACT_DIR"
tar xzf "$BACKUP_FILE" -C "$EXTRACT_DIR" || error "解压失败"

# 找到备份目录
BACKUP_DIR=$(find "$EXTRACT_DIR" -maxdepth 1 -type d ! -path "$EXTRACT_DIR" | head -n1)
log "✓ 备份解压完成: $BACKUP_DIR"

# ==================== 3. 显示备份信息 ====================

if [ -f "$BACKUP_DIR/manifest.txt" ]; then
    log "备份清单:"
    cat "$BACKUP_DIR/manifest.txt" | tee -a "$LOG_FILE"
fi

# ==================== 4. 确认恢复 ====================

echo ""
echo "⚠️  警告: 恢复操作将覆盖当前数据！"
echo "是否继续? (输入 YES 确认)"
read -r CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    log "恢复已取消"
    rm -rf "$EXTRACT_DIR"
    exit 0
fi

# ==================== 5. 停止服务 ====================

log "停止 Docker 服务..."
cd /opt/l2c
docker-compose down || log "⚠ 停止服务失败（可能服务未运行）"
log "✓ 服务已停止"

# ==================== 6. 恢复数据库 ====================

log "恢复数据库..."

# 启动数据库容器
docker-compose up -d supabase-db || error "启动数据库失败"
sleep 10

# 删除现有数据库并重新创建
docker exec l2c-supabase-db psql -U postgres -c "DROP DATABASE IF EXISTS postgres;" || true
docker exec l2c-supabase-db psql -U postgres -c "CREATE DATABASE postgres;" || error "创建数据库失败"

# 恢复数据
docker exec -i l2c-supabase-db pg_restore -U postgres -d postgres -v < "$BACKUP_DIR/database.dump" || error "数据库恢复失败"
log "✓ 数据库恢复完成"

# ==================== 7. 恢复存储文件 ====================

log "恢复存储文件..."
docker exec -i l2c-supabase-storage tar xzf - -C / < "$BACKUP_DIR/storage.tar.gz" || error "存储文件恢复失败"
log "✓ 存储文件恢复完成"

# ==================== 8. 恢复配置文件 ====================

log "恢复配置文件..."
tar xzf "$BACKUP_DIR/config.tar.gz" -C /tmp/ || error "解压配置文件失败"

echo "是否恢复配置文件? (输入 YES 确认，NO 保留当前配置)"
read -r RESTORE_CONFIG

if [ "$RESTORE_CONFIG" == "YES" ]; then
    cp /tmp/config/* /opt/l2c/ || log "⚠ 部分配置文件恢复失败"
    log "✓ 配置文件恢复完成"
else
    log "跳过配置文件恢复"
fi

rm -rf /tmp/config

# ==================== 9. 启动所有服务 ====================

log "启动所有服务..."
cd /opt/l2c
docker-compose up -d || error "启动服务失败"
log "✓ 服务启动成功"

# ==================== 10. 健康检查 ====================

log "等待服务就绪..."
sleep 30

log "检查服务健康状态..."
docker-compose ps

# 验证数据库连接
docker exec l2c-supabase-db psql -U postgres -c "SELECT count(*) FROM pg_database;" > /dev/null || error "数据库连接失败"
log "✓ 数据库连接正常"

# ==================== 11. 清理临时文件 ====================

log "清理临时文件..."
rm -rf "$EXTRACT_DIR"
log "✓ 临时文件已清理"

# ==================== 12. 恢复完成 ====================

log "========================================="
log "恢复完成！"
log "请访问 https://www.luolai-sd.xin 验证系统"
log "========================================="

exit 0
