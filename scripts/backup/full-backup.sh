#!/bin/bash

##############################################################################
# L2C 完整备份脚本
# 功能: 备份数据库、存储文件、配置文件到本地和阿里云OSS
# 作者: L2C Team
# 版本: 1.0
##############################################################################

set -e  # 遇到错误立即退出

# ==================== 配置区 ====================
BACKUP_ROOT="/data/l2c-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/${DATE}"
RETENTION_DAYS=7

# 从环境变量读取配置
source /opt/l2c/.env.production

# 阿里云 OSS 配置
OSS_BUCKET="oss://l2c-backups"
OSS_PATH="database-backups"

# 日志文件
LOG_FILE="${BACKUP_ROOT}/backup.log"

# ==================== 函数定义 ====================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
    exit 1
}

# ==================== 开始备份 ====================

log "========================================="
log "开始备份: $DATE"
log "========================================="

# 创建备份目录
mkdir -p "$BACKUP_DIR" || error "无法创建备份目录"
cd "$BACKUP_DIR"

# ==================== 1. 备份数据库 ====================
log "1/5 开始备份 PostgreSQL 数据库..."
docker exec l2c-supabase-db pg_dump -U postgres -Fc postgres > database.dump || error "数据库备份失败"
log "✓ 数据库备份完成: $(du -sh database.dump | cut -f1)"

# ==================== 2. 备份存储文件 ====================
log "2/5 开始备份 Storage 文件..."
docker exec l2c-supabase-storage tar czf - /var/lib/storage 2>/dev/null > storage.tar.gz || error "存储文件备份失败"
log "✓ 存储文件备份完成: $(du -sh storage.tar.gz | cut -f1)"

# ==================== 3. 备份配置文件 ====================
log "3/5 开始备份配置文件..."
mkdir -p config
cp /opt/l2c/docker-compose.production.yml config/ || error "复制 docker-compose 失败"
cp /opt/l2c/.env.production config/env.backup || error "复制环境变量失败"
cp /opt/l2c/nginx/nginx.conf config/ || error "复制 nginx 配置失败"
tar czf config.tar.gz config/ || error "打包配置文件失败"
rm -rf config
log "✓ 配置文件备份完成: $(du -sh config.tar.gz | cut -f1)"

# ==================== 4. 创建备份清单 ====================
log "4/5 创建备份清单..."
cat > manifest.txt <<EOF
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份类型: 完整备份
数据库大小: $(du -sh database.dump | cut -f1)
存储大小: $(du -sh storage.tar.gz | cut -f1)
配置大小: $(du -sh config.tar.gz | cut -f1)
PostgreSQL版本: $(docker exec l2c-supabase-db psql -U postgres -t -c "SELECT version();" | head -n1 | xargs)
EOF
log "✓ 备份清单创建完成"

# ==================== 5. 压缩整个备份 ====================
log "5/5 压缩备份文件..."
cd "$BACKUP_ROOT"
tar czf "${DATE}.tar.gz" "${DATE}/" || error "压缩备份失败"
BACKUP_SIZE=$(du -sh "${DATE}.tar.gz" | cut -f1)
log "✓ 备份压缩完成: $BACKUP_SIZE"

# ==================== 6. 上传到阿里云 OSS ====================
log "上传备份到阿里云 OSS..."
if command -v ossutil64 &> /dev/null; then
    ossutil64 cp "${DATE}.tar.gz" "${OSS_BUCKET}/${OSS_PATH}/" || log "⚠ OSS上传失败，但本地备份已完成"
    log "✓ OSS上传完成: ${OSS_BUCKET}/${OSS_PATH}/${DATE}.tar.gz"
else
    log "⚠ 未安装 ossutil64，跳过 OSS 上传"
fi

# ==================== 7. 清理本地旧备份 ====================
log "清理 ${RETENTION_DAYS} 天前的本地备份..."
find "$BACKUP_ROOT" -name "*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true
log "✓ 旧备份清理完成"

# ==================== 8. 备份完成 ====================
log "========================================="
log "备份完成！"
log "备份文件: ${DATE}.tar.gz ($BACKUP_SIZE)"
log "保存位置: $BACKUP_ROOT"
log "========================================="

# 发送通知（可选）
# curl -X POST "https://your-webhook-url" -d "Backup completed: $DATE"

exit 0
