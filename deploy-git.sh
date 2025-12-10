#!/bin/bash

# L2C Git方式快速部署脚本
# 直接在服务器上git clone，避免大文件上传

set -e

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
ECS_IP="101.132.152.132"
ECS_USER="root"
ECS_PASSWORD="I@root2025"
DOMAIN="www.luolai-sd.xin"
GITHUB_REPO="git@github.com:Come0520/L2C.git"

# SSH封装
ssh_cmd() {
    sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=no "$ECS_USER@$ECS_IP" "$@"
}

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# 主流程
main() {
    echo "╔═══════════════════════════════╗"
    echo "║  L2C Git快速部署               ║"
    echo "╚═══════════════════════════════╝"
    
    print_info "1/6 测试SSH连接..."
    ssh_cmd "echo 'OK'" > /dev/null && print_success "SSH连接成功"
    
    print_info "2/6 安装Git和依赖..."
    ssh_cmd 'bash -s' << 'ENDSSH'
        # 安装Git
        if ! command -v git &> /dev/null; then
            apt-get update && apt-get install -y git curl
        fi
        
        # 安装Docker（如果未安装）
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | apt-key add -
            add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io
            systemctl start docker && systemctl enable docker
        fi
        
        # 安装Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
ENDSSH
    print_success "依赖安装完成"
    
    print_info "3/6 克隆代码仓库..."
    ssh_cmd << ENDSSH
        cd /opt
        rm -rf l2c
        git clone $GITHUB_REPO l2c
        cd l2c
        echo "代码克隆完成"
ENDSSH
    print_success "代码克隆完成"
    
    print_info "4/6 生成并上传环境变量..."
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > /tmp/l2c.env << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
SUPABASE_ANON_KEY=GEN_ON_SERVER
SUPABASE_SERVICE_ROLE_KEY=GEN_ON_SERVER
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=noreply@luolai-sd.xin
SMTP_PASS=
SMTP_ADMIN_EMAIL=admin@luolai-sd.xin
NEXT_PUBLIC_APP_URL=https://$DOMAIN
TZ=Asia/Shanghai
EOF
    
    sshpass -p "$ECS_PASSWORD" scp -o StrictHostKeyChecking=no /tmp/l2c.env "$ECS_USER@$ECS_IP:/opt/l2c/.env.production"
    rm /tmp/l2c.env
    print_success "环境变量配置完成"
    
    print_info "5/6 配置SSL证书..."
    ssh_cmd << ENDSSH
        apt-get install -y certbot
        mkdir -p /opt/l2c/nginx/ssl
        
        if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN 2>/dev/null || {
                openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                    -keyout /opt/l2c/nginx/ssl/privkey.pem \
                    -out /opt/l2c/nginx/ssl/fullchain.pem \
                    -subj "/CN=$DOMAIN"
            }
        fi
        
        if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            cp /etc/letsencrypt/live/$DOMAIN/*.pem /opt/l2c/nginx/ssl/
        fi
        chmod 644 /opt/l2c/nginx/ssl/*.pem 2>/dev/null || true
ENDSSH
    print_success "SSL配置完成"
    
    print_info "6/6 构建并启动服务（约10分钟）..."
    ssh_cmd 'bash -s' << 'ENDSSH'
        cd /opt/l2c
        
        # 生成JWT tokens
        if [ ! command -v node &> /dev/null ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
            apt-get install -y nodejs
        fi
        npm config set registry https://registry.npmmirror.com
        npm install -g supabase
        
        JWT_SECRET=$(grep JWT_SECRET .env.production | cut -d= -f2)
        ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET")
        SERVICE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET")
        
        sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env.production
        sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.production
        
        # 使用本地构建配置
        [ -f docker-compose.production-local.yml ] && cp docker-compose.production-local.yml docker-compose.yml
        
        # 构建并启动
        docker-compose build
        docker-compose up -d
        sleep 30
        docker-compose ps
ENDSSH
    print_success "服务启动完成"
    
    echo ""
    echo "═════════════════════════════════"
    echo "  🎉 部署完成！"
    echo "═════════════════════════════════"
    echo "🌐 https://$DOMAIN"
    echo "🔧 http://$ECS_IP:3001"
    echo "═════════════════════════════════"
}

main
