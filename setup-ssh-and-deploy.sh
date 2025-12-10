#!/bin/bash

#############################################
# 配置 SSH 密钥并完成部署
#############################################

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ECS_IP="101.132.152.132"
OLD_SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"
NEW_SSH_KEY="$HOME/.ssh/ecs-l2c-deploy"
PUB_KEY=$(cat ${NEW_SSH_KEY}.pub)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}步骤 1/2: 配置 SSH 公钥到服务器${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

echo "将使用旧密钥连接服务器，并添加新公钥..."
echo

# 使用旧密钥添加新公钥到 authorized_keys
ssh -i "$OLD_SSH_KEY" -o StrictHostKeyChecking=no root@$ECS_IP "
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$PUB_KEY' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo '✅ 公钥已添加到 authorized_keys'
"

echo
echo -e "${GREEN}✅ SSH 公钥配置完成${NC}"
echo

# 测试新密钥
echo -e "${BLUE}测试新密钥连接...${NC}"
if ssh -i "$NEW_SSH_KEY" -o StrictHostKeyChecking=no root@$ECS_IP "echo '✅ 新密钥连接成功！'"; then
    echo
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}步骤 2/2: 使用新密钥完成部署${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    
    # 使用新密钥执行部署
    ssh -i "$NEW_SSH_KEY" -o StrictHostKeyChecking=no root@$ECS_IP 'bash -s' << 'ENDSSH'
set -e

cd /opt/l2c/L2C

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "当前位置: $(pwd)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 确定配置文件
if [ -f "docker-compose.production.yml" ]; then
    COMPOSE_FILE="docker-compose.production.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

echo "使用配置文件: $COMPOSE_FILE"
echo

# 检查环境变量
if [ -f ".env.production" ]; then
    echo "✅ 环境变量文件存在"
    ls -lh .env.production
else
    echo "❌ 环境变量文件不存在"
    exit 1
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "开始构建 Docker 镜像（约 10-15 分钟）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 构建镜像
docker compose -f $COMPOSE_FILE build 2>&1 | grep -E "Step|Successfully|ERROR|#[0-9]|=>" || docker compose -f $COMPOSE_FILE build

echo
echo "✅ 镜像构建完成"
echo

# 显示镜像
echo "已构建的镜像："
docker images | head -10

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "启动服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 停止旧容器
echo "停止旧容器..."
docker compose -f $COMPOSE_FILE down 2>/dev/null || true

echo
echo "启动新容器..."
docker compose -f $COMPOSE_FILE up -d

echo
echo "等待服务启动（30秒）..."
sleep 30

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE ps

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "容器日志（最近 50 行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE logs --tail=50

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENDSSH

    echo
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    echo -e "${BLUE}访问应用：${NC}"
    echo "  🌐 https://www.luolai-sd.xin"
    echo "  🔍 健康检查: https://www.luolai-sd.xin/api/health"
    echo
    echo -e "${BLUE}新的 SSH 密钥位置：${NC}"
    echo "  私钥: $NEW_SSH_KEY"
    echo "  公钥: ${NEW_SSH_KEY}.pub"
    echo
    echo -e "${BLUE}后续使用新密钥登录：${NC}"
    echo "  ssh -i $NEW_SSH_KEY root@$ECS_IP"
    echo
else
    echo -e "${YELLOW}⚠️  新密钥测试失败，请手动检查${NC}"
    exit 1
fi
