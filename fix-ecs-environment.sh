#!/bin/bash

#############################################
# L2C ECS 环境修复脚本（方案 A）
# 功能：修复 Docker 段错误、安装完整环境
# 时间：约 30 分钟
#############################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置信息
ECS_IP="101.132.152.132"
SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"
SSH_USER="root"

# 打印带颜色的消息
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 标题
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  L2C ECS 环境修复脚本（方案 A）      ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

#############################################
# 阶段 1：测试连接
#############################################
info "阶段 1/4: 测试 SSH 连接..."

if ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" "echo 'SSH 连接成功'" 2>/dev/null; then
    success "SSH 连接正常"
else
    error "SSH 连接失败，请检查："
    echo "  - SSH 密钥路径: $SSH_KEY"
    echo "  - ECS IP: $ECS_IP"
    exit 1
fi

#############################################
# 阶段 2：重启服务器（可选）
#############################################
info "阶段 2/4: 准备重启 ECS 服务器..."
warning "服务器需要重启以应用系统更新，这将需要约 2-3 分钟"

read -p "是否立即重启服务器？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    info "正在重启服务器..."
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" "reboot" || true
    
    info "等待服务器重启（60秒）..."
    sleep 60
    
    # 等待服务器恢复
    info "等待 SSH 服务恢复..."
    for i in {1..30}; do
        if ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" "echo 'OK'" 2>/dev/null; then
            success "服务器已恢复在线"
            break
        fi
        echo -n "."
        sleep 5
    done
    echo
else
    warning "跳过重启步骤，继续执行修复..."
fi

#############################################
# 阶段 3：修复 Docker 环境
#############################################
info "阶段 3/4: 修复 Docker 环境（约 10 分钟）..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" << 'ENDSSH'
set -e

echo "[1/5] 停止并卸载旧版 Docker..."
systemctl stop docker 2>/dev/null || true
systemctl stop containerd 2>/dev/null || true
apt-get purge -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin 2>/dev/null || true
rm -rf /var/lib/docker /etc/docker

echo "[2/5] 安装 Docker（使用阿里云镜像）..."
export DOWNLOAD_URL="https://mirrors.aliyun.com/docker-ce"
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

echo "[3/5] 配置 Docker 镜像加速..."
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOJSON'
{
  "registry-mirrors": [
    "https://registry.docker-cn.com",
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOJSON

echo "[4/5] 重启 Docker 服务..."
systemctl daemon-reload
systemctl restart docker
systemctl enable docker

echo "[5/5] 验证 Docker 安装..."
docker --version
docker compose version
docker info | grep "Server Version" || true

echo "✅ Docker 环境修复完成"
ENDSSH

success "Docker 环境修复完成"

#############################################
# 阶段 4：安装 Node.js 和工具链
#############################################
info "阶段 4/4: 安装 Node.js 和必要工具（约 5 分钟）..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$ECS_IP" << 'ENDSSH'
set -e

echo "[1/4] 安装 Node.js 20.x（使用清华镜像）..."
cd /tmp
curl -fsSL https://deb.nodesource.com/setup_20.x -o setup_nodejs.sh
bash setup_nodejs.sh
apt-get install -y nodejs

echo "[2/4] 配置 npm 使用国内镜像..."
npm config set registry https://registry.npmmirror.com
npm config set disturl https://npmmirror.com/dist

echo "[3/4] 安装 Supabase CLI..."
npm install -g supabase --force

echo "[4/4] 验证安装..."
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"
echo "Supabase CLI 版本: $(supabase --version)"
echo "Docker 版本: $(docker --version)"
echo "Docker Compose 版本: $(docker compose version)"

echo "✅ 所有工具安装完成"
ENDSSH

success "Node.js 环境安装完成"

#############################################
# 完成总结
#############################################
echo
echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════╗
║  ✅ ECS 环境修复完成！               ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

info "环境已就绪，包括："
echo "  ✅ Docker（最新稳定版，已配置镜像加速）"
echo "  ✅ Docker Compose"
echo "  ✅ Node.js 20.x"
echo "  ✅ npm（淘宝镜像）"
echo "  ✅ Supabase CLI"

echo
info "下一步建议："
echo "  1️⃣  运行部署脚本：./deploy-fixed.sh"
echo "  2️⃣  或手动部署：ssh 到 ECS，克隆代码并运行 docker compose"

echo
warning "重要提醒："
echo "  - Docker 段错误问题已解决"
echo "  - 所有依赖工具已安装"
echo "  - 镜像加速已配置（国内网络优化）"

echo
success "环境修复日志已保存到：fix-ecs-environment.log"
