#!/bin/bash

#############################################
# L2C 应用部署脚本（完整版）
# 使用真实的 Supabase 配置
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
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
DOMAIN="www.luolai-sd.xin"
DEPLOY_DIR="/opt/l2c"

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  L2C 应用部署                        ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

#############################################
# 步骤 1: 准备部署目录和克隆代码
#############################################
info "步骤 1/6: 准备代码仓库..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

# 创建部署目录
mkdir -p /opt/l2c
cd /opt/l2c

# 克隆或更新代码
if [ -d "L2C" ]; then
    echo "代码仓库已存在，执行更新..."
    cd L2C
    git pull origin main || git pull origin master || true
else
    echo "克隆代码仓库（使用 HTTPS）..."
    git clone https://github.com/Come0520/L2C.git
    cd L2C
fi

echo "✅ 代码准备完成"
pwd
ls -la
ENDSSH

if [ $? -eq 0 ]; then
    success "代码仓库已就绪"
else
    error "代码克隆失败"
    exit 1
fi

#############################################
# 步骤 2: 生成并上传环境变量
#############################################
info "步骤 2/6: 生成环境变量文件..."

# 生成随机密钥
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# 创建环境变量文件
cat > /tmp/.env.production << EOF
# ==========================================
# L2C 生产环境配置
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
# ==========================================

# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NEXT_PUBLIC_SITE_URL=https://$DOMAIN

# Supabase 数据库配置
NEXT_PUBLIC_SUPABASE_URL=https://rdpiajialjnmngnaokix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcGlhamlhbGpubW5nbmFva2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NTA4NjAsImV4cCI6MjA0OTEyNjg2MH0.0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcGlhamlhbGpubW5nbmFva2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU1MDg2MCwiZXhwIjoyMDQ5MTI2ODYwfQ.5k6RlR3PqftG29R-yakSGg_z1w-JGHs
DATABASE_URL=postgresql://postgres:I@postgres2025@db.rdpiajialjnmngnaokix.supabase.co:5432/postgres

# 安全密钥（自动生成）
JWT_SECRET=$JWT_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
SESSION_SECRET=$SESSION_SECRET

# NextAuth 配置
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# 功能开关
ENABLE_SIGNUP=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=true

# 日志配置
LOG_LEVEL=info
SENTRY_DSN=

# 其他配置
NEXT_TELEMETRY_DISABLED=1
EOF

# 上传到服务器
scp $SSH_OPTS /tmp/.env.production "$SSH_USER@$ECS_IP:$DEPLOY_DIR/L2C/.env.production"

success "环境变量已生成并上传"

#############################################
# 步骤 3: 检查并配置 SSL 证书
#############################################
info "步骤 3/6: 配置 SSL 证书..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << ENDSSH
set -e

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL 证书已存在"
    
    # 确保 nginx/ssl 目录存在
    mkdir -p $DEPLOY_DIR/L2C/nginx/ssl
    
    # 复制证书
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $DEPLOY_DIR/L2C/nginx/ssl/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $DEPLOY_DIR/L2C/nginx/ssl/
    
    echo "证书文件："
    ls -lh $DEPLOY_DIR/L2C/nginx/ssl/
else
    echo "⚠️  SSL 证书不存在"
    echo "请先运行: certbot certonly --standalone -d $DOMAIN"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    success "SSL 证书配置完成"
else
    warning "SSL 证书配置失败，继续部署（HTTP 模式）"
fi

#############################################
# 步骤 4: 检查 Docker Compose 配置
#############################################
info "步骤 4/6: 检查 Docker Compose 配置..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << ENDSSH
set -e

cd $DEPLOY_DIR/L2C

echo "检查必要文件..."

if [ -f "docker-compose.production.yml" ]; then
    echo "✅ docker-compose.production.yml 存在"
elif [ -f "docker-compose.yml" ]; then
    echo "⚠️  使用 docker-compose.yml"
else
    echo "❌ 未找到 docker-compose 配置文件"
    exit 1
fi

if [ -f "slideboard-frontend/Dockerfile" ]; then
    echo "✅ Dockerfile 存在"
else
    echo "❌ 未找到 Dockerfile"
    exit 1
fi

echo "✅ 配置文件检查完成"
ENDSSH

success "Docker Compose 配置检查完成"

#############################################
# 步骤 5: 构建 Docker 镜像
#############################################
info "步骤 5/6: 构建 Docker 镜像（约 10-15 分钟）..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

cd /opt/l2c/L2C

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "开始构建 Docker 镜像..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 使用 production 配置文件（如果存在）
if [ -f "docker-compose.production.yml" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "使用配置文件: $COMPOSE_FILE"

# 构建镜像
docker compose -f $COMPOSE_FILE build --no-cache 2>&1 | grep -E "Step|Building|Successfully|ERROR|WARN" || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 镜像构建完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 查看镜像
docker images | grep -E "l2c|REPOSITORY"
ENDSSH

if [ $? -eq 0 ]; then
    success "Docker 镜像构建成功"
else
    error "Docker 镜像构建失败"
    exit 1
fi

#############################################
# 步骤 6: 启动服务
#############################################
info "步骤 6/6: 启动服务..."

ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e

cd /opt/l2c/L2C

# 确定配置文件
if [ -f "docker-compose.production.yml" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "停止旧容器..."
docker compose -f $COMPOSE_FILE down || true

echo "启动新容器..."
docker compose -f $COMPOSE_FILE up -d

echo "等待服务启动（30秒）..."
sleep 30

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "服务状态："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE ps

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "最近日志："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE logs --tail=50
ENDSSH

if [ $? -eq 0 ]; then
    success "服务启动成功"
else
    error "服务启动失败"
    exit 1
fi

#############################################
# 完成汇总
#############################################
echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  🎉 部署完成！                       ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

info "应用访问地址："
echo "  🌐 https://$DOMAIN"
echo "  🔍 健康检查: https://$DOMAIN/api/health"

echo
info "查看服务状态："
echo "  ssh $SSH_OPTS $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose ps'"

echo
info "查看实时日志："
echo "  ssh $SSH_OPTS $SSH_USER@$ECS_IP 'cd $DEPLOY_DIR/L2C && docker compose logs -f'"

echo
warning "重要提醒："
echo "  ⚠️  首次访问可能需要等待 1-2 分钟"
echo "  ⚠️  如遇问题，请查看日志排查"

echo
success "部署日志已保存到：deploy-production.log"
