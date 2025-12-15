#!/bin/bash

#############################################
# L2C v1.1.2 版本部署脚本
# 包含：前端文件夹梳理和类型优化
#############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置信息
ECS_IP="139.196.78.237"
SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"
SSH_USER="root"
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
DOMAIN="www.luolai-sd.xin"
DEPLOY_DIR="/opt/l2c"
VERSION="v1.1.2"

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  L2C v1.1.2 版本部署                 ║
║  - 前端文件夹梳理                     ║
║  - 类型文件优化                       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

#############################################
# 步骤 1: 拉取最新代码并切换到 v1.1.2
#############################################
info "步骤 1/5: 拉取最新代码..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

cd /opt/l2c/L2C

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "拉取最新代码..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 拉取最新代码
git fetch --all --tags

# 强制重置本地更改
git reset --hard origin/main

# 切换到 main 分支并拉取
git checkout main
git pull origin main

# 显示最新提交
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "最新的 3 个提交："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -3

echo
echo "✅ 代码更新完成"
ENDSSH

if [ $? -eq 0 ]; then
    success "代码已更新到最新版本"
else
    error "代码更新失败"
    exit 1
fi

#############################################
# 步骤 2: 安装依赖（如有新增）
#############################################
info "步骤 2/5: 检查并安装依赖..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

cd /opt/l2c/L2C/slideboard-frontend

    echo "强制安装依赖..."
    npm install --legacy-peer-deps --loglevel=verbose
    echo "✅ 依赖安装完成"
ENDSSH

success "依赖安装完成"

#############################################
# 步骤 3: 构建应用
#############################################
info "步骤 3/5: 构建应用（约 10-15 分钟）..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

cd /opt/l2c/L2C/slideboard-frontend

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "开始构建..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 清理旧的构建
rm -rf .next

# 设置构建环境
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=6144"

# 构建
npm run build 2>&1 | tee build.log

# 检查构建结果
if [ -f ".next/BUILD_ID" ]; then
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 构建成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "BUILD_ID: $(cat .next/BUILD_ID)"
    ls -lh .next/ | head -10
else
    echo "❌ 构建失败：BUILD_ID 文件不存在"
    echo "查看构建日志："
    tail -50 build.log
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    success "应用构建成功"
else
    error "应用构建失败"
    exit 1
fi

#############################################
# 步骤 4: 重启服务
#############################################
info "步骤 4/5: 重启服务..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

cd /opt/l2c/L2C

echo "重启 Docker 容器..."

# 确定配置文件
if [ -f "docker-compose.production.yml" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# 重启 web-app 服务
docker compose -f $COMPOSE_FILE restart web-app

echo "等待服务启动（30秒）..."
sleep 30

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "服务状态："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE ps

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "最近日志："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE logs --tail=30 web-app
ENDSSH

if [ $? -eq 0 ]; then
    success "服务重启成功"
else
    error "服务重启失败"
    exit 1
fi

#############################################
# 步骤 5: 健康检查
#############################################
info "步骤 5/5: 健康检查..."

sleep 10

# 检查服务响应
if curl -f -s https://$DOMAIN/api/health > /dev/null; then
    success "健康检查通过"
else
    warning "健康检查失败，请手动验证"
fi

#############################################
# 完成汇总
#############################################
echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  🎉 v1.1.2 部署完成！                ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

info "部署内容："
echo "  ✅ 清理垃圾文件（10个）"
echo "  ✅ 合并重复类型文件（2个）"
echo "  ✅ 重命名 api.ts → integrations.ts"
echo "  ✅ 新增类型组织规范文档"

echo
info "应用访问地址："
echo "  🌐 https://$DOMAIN"
echo "  🔍 健康检查: https://$DOMAIN/api/health"

echo
info "查看服务状态："
echo "  ssh $SSH_OPTS $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose ps'"

echo
info "查看实时日志："
echo "  ssh $SSH_OPTS $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose logs -f web-app'"

echo
success "部署完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
