#!/bin/bash

#############################################
# L2C 优化部署脚本
# 前提：已运行 fix-ecs-environment.sh
# 功能：克隆代码、配置环境、构建并启动服务
#############################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置信息
ECS_IP="101.132.152.132"
SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"
SSH_USER="root"
GITHUB_REPO="Come0520/L2C.git"
DOMAIN="www.luolai-sd.xin"
DEPLOY_DIR="/opt/l2c"

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# 标题
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  L2C 优化部署脚本                    ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

#############################################
# 步骤 1: 准备部署目录和代码
#############################################
info "步骤 1/5: 准备部署环境..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" << ENDSSH
set -e

# 创建部署目录
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# 克隆或更新代码
if [ -d "L2C" ]; then
    echo "代码仓库已存在，执行更新..."
    cd L2C
    git pull origin main || true
else
    echo "克隆代码仓库..."
    # 使用 HTTPS 克隆（避免 SSH key 配置问题）
    git clone https://github.com/$GITHUB_REPO L2C
    cd L2C
fi

echo "✅ 代码准备完成"
ENDSSH

success "代码仓库已就绪"

#############################################
# 步骤 2: 生成环境变量
#############################################
info "步骤 2/5: 生成环境变量..."

# 生成随机密钥
JWT_SECRET=\$(openssl rand -base64 32)
NEXTAUTH_SECRET=\$(openssl rand -base64 32)
ENCRYPTION_KEY=\$(openssl rand -base64 32)

cat > /tmp/.env.production << EOF
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN

# 数据库配置（Supabase）
# ⚠️ 请填写您的 Supabase 信息
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# 安全密钥（已自动生成）
JWT_SECRET=$JWT_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# NextAuth 配置
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# 功能开关
ENABLE_SIGNUP=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=true

# 日志配置
LOG_LEVEL=info
EOF

# 上传环境变量文件
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no /tmp/.env.production "$SSH_USER@$ECS_IP:$DEPLOY_DIR/L2C/.env.production"

warning "⚠️  请编辑服务器上的 .env.production 文件，填写真实的 Supabase 配置！"
echo "   SSH 到服务器：ssh -i $SSH_KEY $SSH_USER@$ECS_IP"
echo "   编辑文件：vi $DEPLOY_DIR/L2C/.env.production"
echo
read -p "环境变量配置完成后，按回车继续..." -r

success "环境变量已上传"

#############################################
# 步骤 3: 配置 SSL 证书
#############################################
info "步骤 3/5: 检查 SSL 证书..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" << ENDSSH
set -e

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL 证书已存在"
    
    # 复制证书到 nginx 目录
    mkdir -p $DEPLOY_DIR/L2C/nginx/ssl
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $DEPLOY_DIR/L2C/nginx/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $DEPLOY_DIR/L2C/nginx/ssl/
else
    echo "⚠️  SSL 证书不存在，需要申请"
fi
ENDSSH

success "SSL 证书配置完成"

#############################################
# 步骤 4: 构建 Docker 镜像
#############################################
info "步骤 4/5: 构建 Docker 镜像（约 10-15 分钟）..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" << ENDSSH
set -e

cd $DEPLOY_DIR/L2C

echo "开始构建 Docker 镜像..."
docker compose -f docker-compose.production.yml build --no-cache

echo "✅ 镜像构建完成"
ENDSSH

success "Docker 镜像构建成功"

#############################################
# 步骤 5: 启动服务
#############################################
info "步骤 5/5: 启动服务..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" << ENDSSH
set -e

cd $DEPLOY_DIR/L2C

echo "停止旧容器..."
docker compose -f docker-compose.production.yml down || true

echo "启动新容器..."
docker compose -f docker-compose.production.yml up -d

echo "等待服务启动（30秒）..."
sleep 30

echo "检查服务状态..."
docker compose -f docker-compose.production.yml ps

echo "✅ 服务已启动"
ENDSSH

success "服务启动成功"

#############################################
# 完成总结
#############################################
echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  🎉 部署完成！                       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

info "访问您的应用："
echo "  🌐 https://$DOMAIN"
echo "  🔍 健康检查：https://$DOMAIN/api/health"

echo
info "常用命令："
echo "  查看日志：ssh -i $SSH_KEY $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose logs -f'"
echo "  重启服务：ssh -i $SSH_KEY $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose restart'"
echo "  查看状态：ssh -i $SSH_KEY $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose ps'"

echo
warning "重要提醒："
echo "  ⚠️  请确保已在 .env.production 中填写真实的 Supabase 配置"
echo "  ⚠️  首次访问可能需要等待 1-2 分钟"
echo "  ⚠️  如遇问题，查看日志：docker compose logs"
