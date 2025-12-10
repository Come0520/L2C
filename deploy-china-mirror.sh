#!/bin/bash

# L2C 一键部署脚本（国内镜像源优化版）
# 使用阿里云镜像源加速下载

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 打印消息
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 测试SSH
test_ssh() {
    print_info "测试 SSH 连接..."
    if ssh_cmd "echo 'SSH test OK'" > /dev/null 2>&1; then
        print_success "SSH 连接成功"
    else
        print_error "SSH 连接失败"
        exit 1
    fi
}

# 安装Docker（使用阿里云镜像源）
install_docker() {
    print_info "安装 Docker（使用国内镜像源）..."
    
    ssh_cmd 'bash -s' << 'ENDSSH'
        # 检查Docker是否已安装
        if command -v docker &> /dev/null; then
            echo "Docker 已安装: $(docker --version)"
        else
            echo "开始安装 Docker..."
            
            # 更新apt源
            apt-get update
            
            # 安装必要工具
            apt-get install -y apt-transport-https ca-certificates curl software-properties-common
            
            # 添加Docker官方GPG密钥（使用阿里云镜像）
            curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | apt-key add -
            
            # 添加Docker仓库（使用阿里云镜像）
            add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
            
            # 更新apt索引
            apt-get update
            
            # 安装Docker
            apt-get install -y docker-ce docker-ce-cli containerd.io
            
            # 启动Docker
            systemctl start docker
            systemctl enable docker
            
            # 配置Docker镜像加速器（使用阿里云）
            mkdir -p /etc/docker
            cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://registry.docker-cn.com"
  ]
}
EOF
            systemctl daemon-reload
            systemctl restart docker
            
            echo "Docker 安装完成"
        fi
        
        # 安装Docker Compose
        if command -v docker-compose &> /dev/null; then
            echo "Docker Compose 已安装: $(docker-compose --version)"
        else
            echo "安装 Docker Compose..."
            
            # 使用国内镜像加速（DaoCloud）
            curl -L "https://get.daocloud.io/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            
            chmod +x /usr/local/bin/docker-compose
            
            echo "Docker Compose 安装完成: $(docker-compose --version)"
        fi
ENDSSH
    
    print_success "Docker 环境准备完成"
}

# 创建目录
create_directories() {
    print_info "创建目录结构..."
    ssh_cmd 'mkdir -p /opt/l2c /opt/l2c/nginx/ssl /opt/l2c/nginx/logs /data/l2c-backups && chmod -R 755 /opt/l2c'
    print_success "目录创建完成"
}

# 生成环境变量
generate_env_file() {
    print_info "生成环境变量..."
    
    POSTGRES_PASSWORD=$(openssl rand -base64 24)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 尝试本地生成JWT tokens
    if command -v supabase &> /dev/null; then
        ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET" 2>/dev/null || echo "GEN_ON_SERVER")
        SERVICE_ROLE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET" 2>/dev/null || echo "GEN_ON_SERVER")
    else
        ANON_KEY="GEN_ON_SERVER"
        SERVICE_ROLE_KEY="GEN_ON_SERVER"
    fi
    
    cat > /tmp/l2c-env.production << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_USER=noreply@luolai-sd.xin
SMTP_PASS=
SMTP_ADMIN_EMAIL=admin@luolai-sd.xin
NEXT_PUBLIC_APP_URL=https://$DOMAIN
TZ=Asia/Shanghai
EOF
    
    print_success "环境变量生成完成"
}

# 上传文件
upload_files() {
    print_info "压缩并上传项目文件..."
    
    tar --exclude='node_modules' --exclude='.git' --exclude='.next' --exclude='dist' --exclude='*.log' -czf /tmp/l2c-project.tar.gz .
    
    print_info "上传到服务器..."
    scp_cmd /tmp/l2c-project.tar.gz "$ECS_USER@$ECS_IP:/opt/l2c/"
    scp_cmd /tmp/l2c-env.production "$ECS_USER@$ECS_IP:/opt/l2c/.env.production"
    
    ssh_cmd 'cd /opt/l2c && tar -xzf l2c-project.tar.gz && rm l2c-project.tar.gz'
    
    rm /tmp/l2c-project.tar.gz /tmp/l2c-env.production
    
    print_success "文件上传完成"
}

# 配置SSL
setup_ssl() {
    print_info "配置 SSL 证书..."
    
    ssh_cmd << ENDSSH
        # 安装certbot
        apt-get install -y certbot
        
        # 申请SSL证书
        if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
                echo "SSL证书申请失败，将使用自签名证书"
                # 创建自签名证书作为备份
                openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                    -keyout /opt/l2c/nginx/ssl/privkey.pem \
                    -out /opt/l2c/nginx/ssl/fullchain.pem \
                    -subj "/CN=$DOMAIN"
                exit 0
            }
        fi
        
        # 复制证书
        if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
            cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/l2c/nginx/ssl/
            cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/l2c/nginx/ssl/
        fi
        
        chmod 644 /opt/l2c/nginx/ssl/*.pem
ENDSSH
    
    print_success "SSL 配置完成"
}

# 构建和启动
build_and_start() {
    print_info "构建和启动服务（预计10-15分钟）..."
    
    ssh_cmd 'bash -s' << 'ENDSSH'
        cd /opt/l2c
        
        # 使用本地构建配置
        [ -f docker-compose.production-local.yml ] && cp docker-compose.production-local.yml docker-compose.yml
        
        # 如需在服务器生成JWT
        if grep -q "GEN_ON_SERVER" .env.production; then
            echo "在服务器上生成 JWT tokens..."
            
            # 安装Node.js（使用国内源）
            if ! command -v node &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
                apt-get install -y nodejs
            fi
            
            npm config set registry https://registry.npmmirror.com
            npm install -g supabase
            
            JWT_SECRET=$(grep JWT_SECRET .env.production | cut -d= -f2)
            ANON_KEY=$(supabase gen keys jwt --role anon --secret "$JWT_SECRET")
            SERVICE_ROLE_KEY=$(supabase gen keys jwt --role service_role --secret "$JWT_SECRET")
            
            sed -i "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|" .env.production
            sed -i "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.production
        fi
        
        echo "开始构建镜像..."
        docker-compose build
        
        echo "启动服务..."
        docker-compose up -d
        
        sleep 30
        docker-compose ps
ENDSSH
    
    print_success "服务启动完成"
}

# 验证
verify_deployment() {
    print_info "验证部署..."
    ssh_cmd 'cd /opt/l2c && docker-compose ps'
    print_success "验证完成"
}

# 打印信息
print_deployment_info() {
    echo ""
    echo "========================================="
    echo "  L2C 部署完成！"
    echo "========================================="
    echo "🌐 https://$DOMAIN"
    echo "🔧 http://$ECS_IP:3001"
    echo "========================================="
}

# 主流程
main() {
    echo "╔════════════════════════════════════╗"
    echo "║  L2C 部署（国内镜像源优化版）      ║"
    echo "╚════════════════════════════════════╝"
    
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

main
