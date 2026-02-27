#!/bin/bash
# ============================================================
# L2C 标准化部署脚本
# 用法: bash scripts/deploy.sh
#
# 流程:
# 1. 在本地构建 .next 产物
# 2. 打包并上传到 ECS
# 3. 在 ECS 上解压并重建 Docker 镜像
# 4. 重启服务并验证健康状态
# ============================================================
set -e

# === 配置 ===
ECS_HOST="root@106.15.43.218"
ECS_PROJECT_DIR="/root/L2C"
TAR_FILE="next-build.tar.gz"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# === 前置检查 ===
echo "==========================================="
echo "   L2C 标准化部署    "
echo "==========================================="

# 检查 Git 状态 - 确保没有未提交的修改
DIRTY=$(git status --porcelain --ignore-submodules | grep -v "^??" | head -5)
if [ -n "$DIRTY" ]; then
    log_warn "检测到未提交的修改:"
    echo "$DIRTY"
    read -p "是否继续部署？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "部署已取消"
        exit 1
    fi
fi

GIT_SHA=$(git rev-parse --short HEAD)
GIT_MSG=$(git log --oneline -1)
log_info "当前 Git 提交: $GIT_MSG"

# === 步骤 1: 本地构建 ===
log_info "步骤 1/5: 本地构建 .next 产物..."
pnpm run build

# === 步骤 2: 打包 ===
log_info "步骤 2/5: 打包构建产物..."
tar -czf "$TAR_FILE" .next/standalone .next/static public
FILESIZE=$(du -h "$TAR_FILE" | cut -f1)
log_info "产物大小: $FILESIZE"

# === 步骤 3: 上传到 ECS ===
log_info "步骤 3/5: 上传到 ECS..."
scp "$TAR_FILE" "${ECS_HOST}:${ECS_PROJECT_DIR}/"
log_info "上传完成"

# === 步骤 4: 远程部署 ===
log_info "步骤 4/5: 在 ECS 上解压并重建 Docker 镜像..."
ssh "$ECS_HOST" bash -s <<REMOTE_SCRIPT
set -e
cd ${ECS_PROJECT_DIR}

# 同步 Git 配置文件
git fetch origin main 2>&1
git checkout -f FETCH_HEAD -- .dockerignore docker-compose.prod.yml Dockerfile.prebuilt nginx/ package.json 2>&1

# 解压构建产物
echo "解压构建产物..."
rm -rf .next/standalone .next/static
tar -xzf ${TAR_FILE}

# 临时移除 .dockerignore 中的 .next 规则（Dockerfile.prebuilt 需要 .next）
sed -i '/^\.next$/d' .dockerignore

# 重建 Docker 镜像
echo "重建 Docker 镜像（版本: ${GIT_SHA}）..."
docker-compose -f docker-compose.prod.yml build --no-cache app

# 恢复 .dockerignore
echo ".next" >> .dockerignore

# 重启服务
echo "重启服务..."
docker-compose -f docker-compose.prod.yml up -d app

echo "部署完成！版本: ${GIT_SHA}"
REMOTE_SCRIPT

# === 步骤 5: 验证 ===
log_info "步骤 5/5: 等待服务启动并验证..."
echo "等待 30 秒让服务完全启动..."
sleep 30

# 检查容器状态
CONTAINER_STATUS=$(ssh "$ECS_HOST" "docker ps --filter name=l2c-app --format '{{.Status}}'")
log_info "容器状态: $CONTAINER_STATUS"

# 清理本地 tar
rm -f "$TAR_FILE"
log_info "已清理本地临时文件"

echo ""
echo "==========================================="
echo "   部署完成！"
echo "   版本: $GIT_SHA"
echo "   验证: https://l2c.asia"
echo "==========================================="
