#!/usr/bin/env bash

# 备份脚本 - 定期备份Supabase配置和迁移文件

# 配置
BACKUP_DIR="$(dirname -- "$0")/../backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="supabase_backup_${DATE}.tar.gz"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份内容
BACKUP_CONTENTS="
$(dirname -- "$0")/../supabase/migrations
$(dirname -- "$0")/../supabase/functions
$(dirname -- "$0")/../supabase/config.toml
$(dirname -- "$0")/../slideboard-frontend/.env
$(dirname -- "$0")/../.env
"

echo "🚀 开始备份Supabase配置和迁移文件..."

# 创建备份
tar -czf "$BACKUP_DIR/$BACKUP_FILE" $BACKUP_CONTENTS
if [ $? -eq 0 ]; then
    echo "✅ 备份成功: $BACKUP_DIR/$BACKUP_FILE"
    echo "📦 备份大小: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
else
    echo "❌ 备份失败"
    exit 1
fi

# 清理旧备份（保留最近30天的备份）
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
if [ $? -eq 0 ]; then
    echo "✅ 已清理30天前的旧备份"
else
    echo "❌ 清理旧备份失败"
fi

# 显示当前备份列表
echo "📋 当前备份列表:"
ls -lh "$BACKUP_DIR"/*.tar.gz

echo "🎉 备份完成！"