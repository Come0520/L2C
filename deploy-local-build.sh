#!/bin/bash

# L2C 一键部署脚本（本地构建版）
# 适用于直接在 ECS 上构建 Docker 镜像

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置信息（从基础信息.md读取）
ECS_IP="101.132.152.132"
ECS_USER="root"
SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"
DOMAIN="www.luolai-sd.xin"

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

# 检查必要的文件
check_prerequisites() {
    print_info "检查前置条件..."
    
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH 密钥文件不存在: $SSH_KEY"
        exit 1
    fi
    
    if [ ! -f "docker-compose.production-local.yml" ]; then
        print_error "docker-compose 配置文件不存在"
        exit 1
    fi
    
    chmod 600 "$SSH_KEY"
    print_success "前置条件检查通过"
}

# 测试 SSH 连接
test_ssh() {
    print_info "测试 SSH 连接..."
    
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$ECS_USER@$ECS_IP" "echo 'SSH connection successful'" > /dev/null 2>&1; then
        print_success "SSH 连接成功"
    else
        print_error "SSH 连接失败，请检查 ECS IP 和 SSH 密钥"
        exit 1
    fi
}

# 在 ECS 上安装 Docker
install_docker() {
    print_info "在 ECS 上安装 Docker..."
    
    ssh -i "$SSH_KEY" "$ECS_USER@$ECS_IP" << 'ENDSSH'
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
ENDSSH
    
    print_success "Docker 环境准备完成"
}

# 创建目录结构
create_directories() {
    print_info "创建目录结构..."
    
    ssh -i "$SSH_KEY" "$ECS_USER@$ECS_IP" << 'ENDSSH'
        mkdir -p /opt/l2c
        mkdir -p /opt/l2c/nginx/ssl
        mkdir -p /opt/l2c/nginx/logs
        mkdir -p /data/l2c-backups
        chmod -R 755 /opt/l2c
        echo "目录结构创建完成"
ENDSSH
    
    print_success "目录结构创建完成"
}

# 生成环境变量
generate_env_file() {
    print_info "生成环境变量文件..."
    
    # 生成密钥
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 生成 JWT Tokens（需要 Supabase CLI）
    if command -v supabase &> /dev/null; then
        ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET")
        SERVICE_ROLE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET")
    else
        print_warning "未安装 Supabase CLI，使用占位符"
        print_warning "请手动安装: npm install -g supabase"
        ANON_KEY="REPLACE_WITH_ANON_KEY"
        SERVICE_ROLE_KEY="REPLACE_WITH_SERVICE_ROLE_KEY"
    fi
    
    # 创建 .env.production 文件
    cat > .env.production << EOF
# ==================== 数据库配置 ====================
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# ==================== JWT 配置 ====================
JWT_SECRET=$JWT_SECRET

# ==================== Supabase API 密钥 ====================
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

# ==================== SMTP 邮件配置（可选）====================
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=noreply@luolai-sd.xin
SMTP_PASS=
SMTP_ADMIN_EMAIL=admin@luolai-sd.xin

# ==================== 应用配置 ====================
NEXT_PUBLIC_APP_URL=https://$DOMAIN
TZ=Asia/Shanghai
EOF
    
    print_success "环境变量文件生成完成"
    print_warning "请检查 .env.production 文件并填写 SMTP 密码（如需要）"
}

# 上传文件到 ECS
upload_files() {
    print_info "上传文件到 ECS..."
    
    # 压缩整个项目（排除 node_modules）
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.next' \
        --exclude='dist' \
        -czf l2c-project.tar.gz .
    
    # 上传到 ECS
    scp -i "$SSH_KEY" l2c-project.tar.gz "$ECS_USER@$ECS_IP:/opt/l2c/"
    
    # 在 ECS 上解压
    ssh -i "$SSH_KEY" "$ECS_USER@$ECS_IP" << 'ENDSSH'
        cd /opt/l2c
        tar -xzf l2c-project.tar.gz
        rm l2c-project.tar.gz
        echo "文件上传并解压完成"
ENDSSH
    
    # 删除本地压缩文件
    rm l2c-project.tar.gz
    
    print_success "文件上传完成"
}

# 配置 SSL 证书
setup_ssl() {
    print_info "配置 SSL 证书..."
    
    ssh -i "$SSH_KEY" "$ECS_USER@$ECS_IP" << ENDSSH
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
    print_info "构建和启动服务..."
    
    ssh -i "$SSH_KEY" "$ECS_USER@$ECS_IP" << 'ENDSSH'
        cd /opt/l2c
        
        # 使用本地构建版的 docker-compose
        cp docker-compose.production-local.yml docker-compose.yml
        
        # 构建镜像（首次会比较慢，5-10分钟）
        echo "开始构建 Docker 镜像，这可能需要5-10分钟..."
        docker-compose build --no-cache
        
        # 启动所有服务
        echo "启动所有服务..."
        docker-compose up -d
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 30
        
        # 查看服务状态
        docker-compose ps
ENDSSH
    
    print_success "服务启动完成"
}

# 验证部署
verify_deployment() {
    print_info "验证部署..."
    
    # 检查服务状态
    ssh -i "$SSH_KEY" "$ECS_USER@$ECS_IP" << 'ENDSSH'
        cd /opt/l2c
        
        # 检查所有容器状态
        echo "=== 容器状态 ==="
        docker-compose ps
        
        # 检查日志
        echo ""
        echo "=== 应用日志（最后20行）==="
        docker-compose logs --tail=20 web-app
ENDSSH
    
    # 测试 HTTPS 访问
    print_info "测试 HTTPS 访问..."
    if curl -k -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200\|301\|302"; then
        print_success "HTTPS 访问正常"
    else
        print_warning "HTTPS 访问可能有问题，请手动检查"
    fi
    
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
    echo "📝 环境变量文件: /opt/l2c/.env.production"
    echo "⚠️  请妥善保管环境变量文件中的密钥！"
    echo ""
    echo "========================================="
    echo ""
    echo "常用命令:"
    echo "  查看日志: ssh -i $SSH_KEY $ECS_USER@$ECS_IP 'cd /opt/l2c && docker-compose logs -f'"
    echo "  重启服务: ssh -i $SSH_KEY $ECS_USER@$ECS_IP 'cd /opt/l2c && docker-compose restart'"
    echo "  停止服务: ssh -i $SSH_KEY $ECS_USER@$ECS_IP 'cd /opt/l2c && docker-compose down'"
    echo ""
}

# 主流程
main() {
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║   L2C 一键部署脚本（本地构建版）    ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
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
