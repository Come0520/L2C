#!/bin/bash

#############################################
# L2C v1.1.5 版本部署脚本（PM2版本）
# 使用PM2管理Node.js进程，直接启动Next.js应用
#############################################

# 设置错误处理
set -e
set -o pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置信息（可通过环境变量覆盖）
ECS_IP=${ECS_IP:-"139.196.78.237"}
SSH_KEY=${SSH_KEY:-"/Users/laichangcheng/Downloads/罗莱-圣都.pem"}
SSH_USER=${SSH_USER:-"root"}
SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
DOMAIN=${DOMAIN:-"www.luolai-sd.xin"}
DEPLOY_DIR=${DEPLOY_DIR:-"/opt/l2c"}
VERSION=${VERSION:-"v1.1.5"}
PM2_APP_NAME=${PM2_APP_NAME:-"l2c-frontend"}

# 日志函数
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error_exit() { error "$1"; exit 1; }

# 检查必要文件
if [ ! -f "$SSH_KEY" ]; then
    error_exit "SSH密钥文件不存在: $SSH_KEY"
fi

# 检查SSH连接
test_ssh_connection() {
    info "测试SSH连接..."
    if ssh $SSH_OPTS "$SSH_USER@$ECS_IP" exit > /dev/null 2>&1; then
        success "SSH连接成功"
        return 0
    else
        error_exit "SSH连接失败，请检查IP地址和密钥文件"
        return 1
    fi
}

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  L2C v1.1.5 版本部署                 ║
║  - 使用PM2管理Node.js进程             ║
║  - 直接启动Next.js应用                ║
║  - 包含所有最新功能和修复             ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# 测试SSH连接
test_ssh_connection

#############################################
# 步骤 1: 切换到 v1.1.5 标签
#############################################
info "步骤 1/6: 切换到标签${VERSION}..."

if ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << ENDSSH
set -e
set -o pipefail

# 检查部署目录是否存在
if [ ! -d "/opt/l2c/L2C" ]; then
    echo "错误：部署目录不存在 /opt/l2c/L2C"
    exit 1
fi

cd /opt/l2c/L2C

# 检查是否为git仓库
if [ ! -d ".git" ]; then
    echo "错误：当前目录不是git仓库"
    exit 1
fi

# 切换到指定标签
info "正在切换到标签 ${VERSION}..."
if git checkout -f ${VERSION}; then
    echo "成功：已切换到标签 ${VERSION}"
else
    echo "错误：切换标签失败"
    exit 1
fi

# 获取当前版本信息
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "当前版本信息："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git describe --tags
git log -1 --oneline

echo
echo "✅ 代码已切换到标签 ${VERSION}"
ENDSSH; then
    success "代码已切换到标签${VERSION}"
else
    error_exit "切换标签失败"
fi

#############################################
# 步骤 2: 安装依赖（如有新增）
#############################################
info "步骤 2/6: 检查并安装依赖..."

if ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e
set -o pipefail

FRONTEND_DIR="/opt/l2c/L2C/slideboard-frontend"

# 检查前端目录是否存在
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "错误：前端目录不存在 $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "错误：package.json不存在"
    exit 1
fi

echo "正在安装依赖..."
if npm install --legacy-peer-deps --loglevel=error; then
    echo "✅ 依赖安装完成"
else
    echo "错误：依赖安装失败"
    exit 1
fi
ENDSSH; then
    success "依赖安装完成"
else
    error_exit "依赖安装失败"
fi

#############################################
# 步骤 3: 构建应用
#############################################
info "步骤 3/6: 构建应用..."

if ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e
set -o pipefail

FRONTEND_DIR="/opt/l2c/L2C/slideboard-frontend"
cd "$FRONTEND_DIR"

 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
 echo "开始构建..."
 echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 清理旧的构建
rm -rf .next

# 设置构建环境
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=6144"

# 构建
if npm run build > build.log 2>&1; then
    # 检查构建结果
    if [ -f ".next/BUILD_ID" ]; then
        echo
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ 构建成功！"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "BUILD_ID: $(cat .next/BUILD_ID)"
    else
        echo "❌ 构建失败：BUILD_ID 文件不存在"
        echo "查看构建日志："
        tail -50 build.log
        exit 1
    fi
else
    echo "❌ 构建命令执行失败"
    echo "查看构建日志："
    tail -50 build.log
    exit 1
fi
ENDSSH; then
    success "应用构建成功"
else
    error_exit "应用构建失败"
fi

#############################################
# 步骤 4: 安装PM2（如果未安装）
#############################################
info "步骤 4/6: 安装PM2..."

if ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << 'ENDSSH'
set -e
set -o pipefail

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "PM2 未安装，开始安装..."
    if npm install -g pm2; then
        echo "✅ PM2 安装完成"
    else
        echo "错误：PM2安装失败"
        exit 1
    fi
else
    echo "✅ PM2 已安装"
fi

# 更新PM2到最新版本
echo "更新PM2到最新版本..."
npm update -g pm2 > /dev/null 2>&1
ENDSSH; then
    success "PM2安装完成"
else
    error_exit "PM2安装失败"
fi

#############################################
# 步骤 5: 启动应用
#############################################
info "步骤 5/6: 启动应用..."

if ssh $SSH_OPTS "$SSH_USER@$ECS_IP" bash << ENDSSH
set -e
set -o pipefail

FRONTEND_DIR="/opt/l2c/L2C/slideboard-frontend"
cd "$FRONTEND_DIR"

# 设置环境变量
export NODE_ENV=production
export PORT=3000
export HOSTNAME="0.0.0.0"

# 停止现有应用（如果存在）
echo "检查并停止现有应用..."
for app_name in "l2c-frontend" "l2c-web-app"; do
    if pm2 list | grep -q "$app_name"; then
        echo "停止现有应用 $app_name..."
        pm2 stop "$app_name"
        pm2 delete "$app_name"
    fi
done

# 启动新应用
echo "启动新应用..."
if pm2 start npm --name "$PM2_APP_NAME" -- start; then
    echo "✅ 应用启动成功"
else
    echo "错误：应用启动失败"
    exit 1
fi

# 保存PM2配置
echo "保存PM2配置..."
pm2 save > /dev/null 2>&1

# 配置PM2开机自启
echo "配置PM2开机自启..."
pm2 startup > /dev/null 2>&1

# 查看应用状态
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "应用状态："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list

# 查看最近日志
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "最近日志："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs $PM2_APP_NAME --lines 20
ENDSSH; then
    success "应用启动成功"
else
    error_exit "应用启动失败"
fi

#############################################
# 步骤 6: 健康检查
#############################################
info "步骤 6/6: 健康检查..."

# 健康检查配置
HEALTH_CHECK_URL="http://$ECS_IP:3000/api/health"
RETRY_COUNT=5
RETRY_DELAY=5
TIMEOUT=30

# 检查服务响应（带重试机制）
for ((i=1; i<=$RETRY_COUNT; i++)); do
    info "尝试第 $i/$RETRY_COUNT 次健康检查..."
    
    if curl -f -s -m $TIMEOUT $HEALTH_CHECK_URL > /dev/null; then
        success "健康检查通过"
        HEALTH_CHECK_PASSED=true
        break
    else
        warning "健康检查失败，$RETRY_DELAY 秒后重试"
        sleep $RETRY_DELAY
        # 指数退避
        RETRY_DELAY=$((RETRY_DELAY * 2))
    fi
done

if [ "$HEALTH_CHECK_PASSED" != "true" ]; then
    error "健康检查失败，请手动验证"
    error "请检查应用日志: ssh $SSH_OPTS $SSH_USER@$ECS_IP 'pm2 logs $PM2_APP_NAME --lines 50'"
fi

#############################################
# 完成汇总
#############################################
echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  🎉 v1.1.5 部署完成！                ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

info "部署内容："
echo "  ✅ 部署标签版本 v1.1.5"
echo "  ✅ 使用PM2管理Node.js进程"
echo "  ✅ 前端代码优化和bug修复"
echo "  ✅ 后端服务稳定性提升"

echo
info "应用访问地址："
echo "  🌐 http://$ECS_IP:3000"
echo "  🔍 健康检查: http://$ECS_IP:3000/api/health"

echo
info "查看服务状态："
echo "  ssh $SSH_OPTS $SSH_USER@$ECS_IP 'pm2 list'"

echo
info "查看实时日志："
echo "  ssh $SSH_OPTS $SSH_USER@$ECS_IP 'pm2 logs $PM2_APP_NAME'"

echo
info "常用PM2命令："
echo "  pm2 list            # 查看所有应用"
echo "  pm2 stop $PM2_APP_NAME  # 停止应用"
echo "  pm2 start $PM2_APP_NAME # 启动应用"
echo "  pm2 restart $PM2_APP_NAME # 重启应用"
echo "  pm2 logs $PM2_APP_NAME --lines 100 # 查看日志"

echo
success "部署完成时间: $(date '+%Y-%m-%d %H:%M:%S')"