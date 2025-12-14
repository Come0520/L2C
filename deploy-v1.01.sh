#!/bin/bash

#############################################
# L2C v1.01 版本更新部署脚本
# 在阿里云ECS上更新到v1.01
#############################################

set -e  # 遇到错误立即停止

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 L2C 更新到 v1.01"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# ECS服务器配置
ECS_IP="101.132.152.132"
ECS_USER="root"
PROJECT_DIR="/opt/l2c/L2C/slideboard-frontend"

echo "服务器: $ECS_USER@$ECS_IP"
echo "项目目录: $PROJECT_DIR"
echo

# 步骤1: 连接到ECS并更新代码
echo "[1/5] 连接到ECS并拉取v1.01代码"
ssh $ECS_USER@$ECS_IP << 'ENDSSH'
    cd /opt/l2c/L2C
    
    # 创建当前版本备份
    BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
    echo "创建备份分支: $BACKUP_BRANCH"
    git branch $BACKUP_BRANCH
    
    # 拉取最新代码和标签
    echo "拉取最新代码..."
    git fetch --all --tags
    
    # 切换到v1.01
    echo "切换到v1.01..."
    git checkout tags/v1.01 -b release-v1.01 2>/dev/null || git checkout release-v1.01
    git pull origin main || true
    
    echo "✅ 代码已更新到v1.01"
ENDSSH

echo "✅ 步骤1完成"
echo

# 步骤2: 安装依赖（如果package.json有变化）
echo "[2/5] 检查并更新依赖"
ssh $ECS_USER@$ECS_IP << 'ENDSSH'
    cd /opt/l2c/L2C/slideboard-frontend
    
    echo "更新npm依赖..."
    npm install --production=false
    
    echo "✅ 依赖已更新"
ENDSSH

echo "✅ 步骤2完成"
echo

# 步骤3: 构建应用
echo "[3/5] 构建应用"
ssh $ECS_USER@$ECS_IP << 'ENDSSH'
    cd /opt/l2c/L2C/slideboard-frontend
    
    echo "开始构建（可能需要10-20分钟）..."
    export NODE_OPTIONS="--max-old-space-size=6144"
    NODE_ENV=production npm run build
    
    # 验证构建
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "❌ 构建失败！"
        exit 1
    fi
    
    echo "✅ 构建成功！BUILD_ID: $(cat .next/BUILD_ID)"
ENDSSH

echo "✅ 步骤3完成"
echo

# 步骤4: 重启应用
echo "[4/5] 重启应用"
ssh $ECS_USER@$ECS_IP << 'ENDSSH'
    echo "重启PM2应用..."
    pm2 restart l2c
    
    echo "等待应用启动..."
    sleep 10
    
    echo "✅ 应用已重启"
ENDSSH

echo "✅ 步骤4完成"
echo

# 步骤5: 验证部署
echo "[5/5] 验证部署"
ssh $ECS_USER@$ECS_IP << 'ENDSSH'
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 PM2 状态"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pm2 list
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🏥 健康检查"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    curl -I http://localhost:3000/api/health || echo "健康检查端点可能不可用"
    
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 最近日志"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pm2 logs l2c --lines 20 --nostream
ENDSSH

echo "✅ 步骤5完成"
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ v1.01部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "访问应用："
echo "  🌐 http://101.132.152.132:3000"
echo "  🌐 http://www.luolai-sd.xin:3000"
echo
echo "如需回滚，执行："
echo "  ssh $ECS_USER@$ECS_IP"
echo "  cd /opt/l2c/L2C"
echo "  git checkout \$BACKUP_BRANCH"
echo "  cd slideboard-frontend && npm run build"
echo "  pm2 restart l2c"
echo
