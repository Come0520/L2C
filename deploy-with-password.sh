#!/bin/bash

# L2C 一键部署脚本（密码登录版）
# 适用于直接在 ECS 上构建 Docker 镜像

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置信息
ECS_IP="101.132.152.132"
ECS_USER="root"
ECS_PASSWORD="I@root2025"
DOMAIN="www.luolai-sd.xin"

# SSH命令封装
ssh_cmd() {
    sshpass -p "$ECS_PASSWORD" ssh -o StrictHostKeyChecking=no "$ECS_USER@$ECS_IP" "$@"
}

scp_cmd() {
    sshpass -p "$ECS_PASSWORD" scp -o StrictHostKeyChecking=no "$@"
}

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 测试 SSH 连接
test_ssh() {
    print_info "测试 SSH 连接..."
    
    if ssh_cmd "echo 'SSH connection successful'" > /dev/null 2>&1; then
        print_success "SSH 连接成功"
    else
        print_error "SSH 连接失败"
        exit 1
    fi
}

# 在 ECS 上安装 Docker
install_docker() {
    print_info "在 ECS 上安装 Docker..."
    
    ssh_cmd '
        # 检查 Docker 是否已安装
        if command -v docker &> /dev/null; then
            echo "Docker 已安装"
            docker --version
        else
            echo "安装 Docker..."
            curl -fsSL https://get.docker.com | bash
            systemctl start docker
            systemctl enable docker
            echo "Docker 安装完成"
        fi
        
        # 检查 Docker Compose 是否已安装
        if command -v docker-compose &> /dev/null; then
            echo "Docker Compose 已安装"
            docker-compose --version
        else
            echo "安装 Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
            echo "Docker Compose 安装完成"
        fi
    '
    
    print_success "Docker 环境准备完成"
}

# 创建目录结构
create_directories() {
    print_info "创建目录结构..."
    
    ssh_cmd '
        mkdir -p /opt/l2c
        mkdir -p /opt/l2c/nginx/ssl
        mkdir -p /opt/l2c/nginx/logs
        mkdir -p /data/l2c-backups
        chmod -R 755 /opt/l2c
        echo "目录结构创建完成"
    '
    
    print_success "目录结构创建完成"
}

# 生成环境变量
generate_env_file() {
    print_info "生成环境变量文件..."
    
    # 生成密钥
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 生成 JWT Tokens
    if command -v supabase &> /dev/null; then
        ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET" 2>/dev/null || echo "REPLACE_WITH_ANON_KEY")
        SERVICE_ROLE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET" 2>/dev/null || echo "REPLACE_WITH_SERVICE_ROLE_KEY")
    else
        print_warning "未安装 Supabase CLI，将在服务器上生成"
        ANON_KEY="WILL_GENERATE_ON_SERVER"
        SERVICE_ROLE_KEY="WILL_GENERATE_ON_SERVER"
    fi
    
    # 创建 .env.production 文件
    cat > /tmp/l2c-env.production << EOF
# 数据库配置
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# JWT 配置
JWT_SECRET=$JWT_SECRET

# Supabase API 密钥
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

# SMTP 邮件配置（可选）
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=noreply@luolai-sd.xin
SMTP_PASS=
SMTP_ADMIN_EMAIL=admin@luolai-sd.xin

# 应用配置
NEXT_PUBLIC_APP_URL=https://$DOMAIN
TZ=Asia/Shanghai
EOF
    
    print_success "环境变量文件生成完成"
}

# 上传文件到 ECS
upload_files() {
    print_info "上传文件到 ECS（这可能需要几分钟）..."
    
    # 压缩整个项目
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='*.log' \
        -czf /tmp/l2c-project.tar.gz .
    
    # 上传项目和环境变量
    scp_cmd /tmp/l2c-project.tar.gz "$ECS_USER@$ECS_IP:/opt/l2c/"
    scp_cmd /tmp/l2c-env.production "$ECS_USER@$ECS_IP:/opt/l2c/.env.production"
    
    # 在 ECS 上解压
    ssh_cmd '
        cd /opt/l2c
        tar -xzf l2c-project.tar.gz
        rm l2c-project.tar.gz
        echo "文件解压完成"
    '
    
    # 删除临时文件
    rm /tmp/l2c-project.tar.gz /tmp/l2c-env.production
    
    print_success "文件上传完成"
}

# 配置 SSL 证书
setup_ssl() {
    print_info "配置 SSL 证书..."
    
    ssh_cmd << ENDSSH
        # 安装 certbot
        if ! command -v certbot &> /dev/null; then
            apt-get update
            apt-get install -y certbot
        fi
        
        # 申请 SSL 证书
        if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        fi
        
        # 复制证书
        cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/l2c/nginx/ssl/
        cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/l2c/nginx/ssl/
        chmod 644 /opt/l2c/nginx/ssl/*.pem
        
        echo "SSL 证书配置完成"
ENDSSH
    
    print_success "SSL 证书配置完成"
}

# 构建和启动服务
build_and_start() {
    print_info "构建和启动服务（这可能需要10-15分钟）..."
    
    ssh_cmd '
        cd /opt/l2c
        
        # 使用本地构建版
        if [ -f docker-compose.production-local.yml ]; then
            cp docker-compose.production-local.yml docker-compose.yml
        fi
        
        # 如果需要在服务器上生成JWT tokens
        if grep -q "WILL_GENERATE_ON_SERVER" .env.production; then
            echo "在服务器上生成 JWT tokens..."
            # 安装Node.js（如果还没安装）
            if ! command -v node &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                apt-get install -y nodejs
            fi
            
            # 安装Supabase CLI
            npm install -g supabase
            
            # 读取JWT_SECRET并生成tokens
            JWT_SECRET=$(grep JWT_SECRET .env.production | cut -d= -f2)
            ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET")
            SERVICE_ROLE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET")
            
            # 更新环境变量文件
            sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env.production
            sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.production
        fi
        
        # 构建镜像
        echo "开始构建 Docker 镜像..."
        docker-compose build --no-cache
        
        # 启动所有服务
        echo "启动所有服务..."
        docker-compose up -d
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 30
        
        # 查看服务状态
        docker-compose ps
    '
    
    print_success "服务启动完成"
}

# 验证部署
verify_deployment() {
    print_info "验证部署..."
    
    ssh_cmd '
        cd /opt/l2c
        echo "=== 容器状态 ==="
        docker-compose ps
    '
    
    print_success "部署验证完成"
}

# 打印部署信息
print_deployment_info() {
    echo ""
    echo "========================================="
    echo "       L2C 部署完成！"
    echo "========================================="
    echo ""
    echo "🌐 应用地址: https://$DOMAIN"
    echo "🔧 Supabase Studio: http://$ECS_IP:3001"
    echo "📂 项目目录: /opt/l2c"
    echo "💾 备份目录: /data/l2c-backups"
    echo ""
    echo "========================================="
    echo ""
}

# 主流程
main() {
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║   L2C 一键部署脚本（密码登录版）    ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    
    test_ssh
    install_docker
    create_directories
    generate_env_file
    upload_files
    setup_ssl
    build_and_start
    verify_deployment
    print_deployment_info
    
    print_success "🎉 部署完成！"
}

# 运行主流程
main
