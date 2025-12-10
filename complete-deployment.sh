#!/bin/bash

#############################################
# L2C 完成部署脚本
# 完成 Docker 构建和服务启动
#############################################

set -e

ECS_IP="101.132.152.132"
SSH_KEY="/Users/laichangcheng/Downloads/罗莱-圣都.pem"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "完成 L2C 应用部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "正在连接到 ECS 服务器并完成部署..."
echo

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@$ECS_IP << 'ENDSSH'
set -e

cd /opt/l2c/L2C

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 1/3: 检查部署状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "当前目录: $(pwd)"
echo

if [ -f ".env.production" ]; then
    echo "✅ 环境变量文件已存在"
    ls -lh .env.production
else
    echo "❌ 环境变量文件不存在"
    exit 1
fi

echo

if [ -f "docker-compose.production.yml" ]; then
    echo "✅ Docker Compose 配置文件存在"
    COMPOSE_FILE="docker-compose.production.yml"
elif [ -f "docker-compose.yml" ]; then
    echo "✅ 使用 docker-compose.yml"
    COMPOSE_FILE="docker-compose.yml"
else
    echo "❌ 未找到 Docker Compose 配置文件"
    exit 1
fi

echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 2/3: 构建 Docker 镜像"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

echo "开始构建镜像（这可能需要 10-15 分钟）..."
echo

# 构建镜像，显示关键步骤
docker compose -f $COMPOSE_FILE build 2>&1 | \
    grep -E "Step|Building|Successfully|ERROR|WARN|Sending build context|COPY|RUN|FROM|=>|#" || \
    docker compose -f $COMPOSE_FILE build

echo
echo "✅ 镜像构建完成"
echo

# 显示镜像
echo "已构建的镜像："
docker images | head -10

echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤 3/3: 启动服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 停止旧容器
echo "停止旧容器..."
docker compose -f $COMPOSE_FILE down || true

echo
echo "启动服务..."
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
echo "容器日志（最近 30 行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker compose -f $COMPOSE_FILE logs --tail=30

echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "访问应用："
echo "  🌐 https://www.luolai-sd.xin"
echo "  🔍 健康检查: https://www.luolai-sd.xin/api/health"
echo
echo "查看日志："
echo "  docker compose -f $COMPOSE_FILE logs -f"
echo

ENDSSH

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
