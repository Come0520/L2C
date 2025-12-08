#!/bin/bash

# 罗莱L2C销售管理系统 - 环境配置设置脚本
# 版本: 1.0
# 作者: L2C开发团队

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
罗莱L2C销售管理系统 - 环境配置设置脚本

用法: $0 [选项] <环境类型>

环境类型:
  development    开发环境
  staging        测试环境
  production     生产环境

选项:
  -h, --help     显示此帮助信息
  -f, --force    强制覆盖现有配置文件
  -v, --verbose  详细输出

示例:
  $0 development
  $0 production --force
  $0 staging --verbose

EOF
}

# 生成随机密钥
generate_secret() {
    openssl rand -base64 32
}

# 生成JWT密钥
generate_jwt_secret() {
    openssl rand -base64 64
}

# 创建开发环境配置
create_development_config() {
    log_info "创建开发环境配置..."
    
    # 前端配置
    cat > frontend/.env.development << EOF
# 开发环境配置
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=罗莱L2C销售管理系统（开发环境）
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK=false
VITE_LOG_LEVEL=debug
EOF

    # 后端配置
    cat > backend/.env.development << EOF
# 开发环境配置
NODE_ENV=development
PORT=3001

# 数据库配置
DATABASE_URL=postgresql://luolai:luolai123@localhost:5432/luolai_l2c_dev
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=$(generate_jwt_secret)
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=http://localhost:5173

# 日志配置
LOG_LEVEL=debug
LOG_FILE=logs/development.log

# 邮件配置（开发环境使用测试邮箱）
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=test@ethereal.email
SMTP_PASS=test123
SMTP_FROM=noreply@luolai-l2c.com

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# 缓存配置
CACHE_TTL=300
CACHE_MAX_KEYS=1000
EOF

    log_success "开发环境配置创建完成"
}

# 创建测试环境配置
create_staging_config() {
    log_info "创建测试环境配置..."
    
    # 前端配置
    cat > frontend/.env.staging << EOF
# 测试环境配置
NODE_ENV=staging
VITE_API_BASE_URL=https://api-staging.luolai-l2c.com/api
VITE_APP_TITLE=罗莱L2C销售管理系统（测试环境）
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK=false
VITE_LOG_LEVEL=info
EOF

    # 后端配置
    cat > backend/.env.staging << EOF
# 测试环境配置
NODE_ENV=staging
PORT=3001

# 数据库配置
DATABASE_URL=postgresql://luolai:\${POSTGRES_PASSWORD}@postgres-staging:5432/luolai_l2c_staging
REDIS_HOST=redis-staging
REDIS_PORT=6379

# JWT配置
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://staging.luolai-l2c.com

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/staging.log

# 邮件配置
SMTP_HOST=\${SMTP_HOST}
SMTP_PORT=\${SMTP_PORT}
SMTP_USER=\${SMTP_USER}
SMTP_PASS=\${SMTP_PASS}
SMTP_FROM=noreply@luolai-l2c.com

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# 缓存配置
CACHE_TTL=600
CACHE_MAX_KEYS=5000

# 监控配置
SENTRY_DSN=\${SENTRY_DSN}
ENABLE_METRICS=true
EOF

    log_success "测试环境配置创建完成"
}

# 创建生产环境配置
create_production_config() {
    log_info "创建生产环境配置..."
    
    # 前端配置
    cat > frontend/.env.production << EOF
# 生产环境配置
NODE_ENV=production
VITE_API_BASE_URL=https://api.luolai-l2c.com/api
VITE_APP_TITLE=罗莱L2C销售管理系统
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK=false
VITE_LOG_LEVEL=warn
EOF

    # 后端配置
    cat > backend/.env.production << EOF
# 生产环境配置
NODE_ENV=production
PORT=3001

# 数据库配置
DATABASE_URL=postgresql://luolai:\${POSTGRES_PASSWORD}@postgres-master:5432/luolai_l2c
DATABASE_READ_URL=postgresql://luolai:\${POSTGRES_PASSWORD}@postgres-slave:5432/luolai_l2c
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379

# JWT配置
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://luolai-l2c.com

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/production.log

# 邮件配置
SMTP_HOST=\${SMTP_HOST}
SMTP_PORT=\${SMTP_PORT}
SMTP_USER=\${SMTP_USER}
SMTP_PASS=\${SMTP_PASS}
SMTP_FROM=noreply@luolai-l2c.com

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# 缓存配置
CACHE_TTL=3600
CACHE_MAX_KEYS=10000

# 安全配置
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12

# 监控配置
SENTRY_DSN=\${SENTRY_DSN}
ENABLE_METRICS=true
METRICS_PORT=9464

# 备份配置
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
EOF

    log_success "生产环境配置创建完成"
}

# 验证配置文件
validate_config() {
    local env_type=$1
    log_info "验证${env_type}环境配置..."
    
    local frontend_env="frontend/.env.${env_type}"
    local backend_env="backend/.env.${env_type}"
    
    if [ ! -f "$frontend_env" ]; then
        log_error "前端配置文件不存在: $frontend_env"
        return 1
    fi
    
    if [ ! -f "$backend_env" ]; then
        log_error "后端配置文件不存在: $backend_env"
        return 1
    fi
    
    # 检查必要的环境变量
    if [ "$env_type" = "production" ]; then
        local required_vars=("JWT_SECRET" "POSTGRES_PASSWORD" "SMTP_HOST" "SMTP_USER" "SMTP_PASS")
        for var in "${required_vars[@]}"; do
            if ! grep -q "$var" "$backend_env"; then
                log_warning "生产环境配置中缺少必要变量: $var"
            fi
        done
    fi
    
    log_success "配置文件验证通过"
}

# 设置文件权限
set_permissions() {
    log_info "设置配置文件权限..."
    
    # 设置环境配置文件为只读
    find . -name ".env.*" -type f -exec chmod 600 {} \;
    
    log_success "文件权限设置完成"
}

# 主函数
main() {
    local env_type=""
    local force=false
    local verbose=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            development|staging|production)
                env_type=$1
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查环境类型
    if [ -z "$env_type" ]; then
        log_error "请指定环境类型"
        show_help
        exit 1
    fi
    
    log_info "开始设置${env_type}环境配置..."
    
    # 检查是否强制覆盖
    if [ "$force" = false ]; then
        if [ -f "frontend/.env.${env_type}" ] || [ -f "backend/.env.${env_type}" ]; then
            log_warning "配置文件已存在，使用 --force 参数强制覆盖"
            exit 1
        fi
    fi
    
    # 创建配置文件
    case $env_type in
        development)
            create_development_config
            ;;
        staging)
            create_staging_config
            ;;
        production)
            create_production_config
            ;;
    esac
    
    # 验证配置
    validate_config "$env_type"
    
    # 设置权限
    set_permissions
    
    log_success "🎉 ${env_type}环境配置设置完成！"
    
    if [ "$env_type" = "production" ]; then
        log_warning "⚠️  请确保在部署前设置所有必要的环境变量！"
    fi
}

# 错误处理
trap 'log_error "配置设置过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"