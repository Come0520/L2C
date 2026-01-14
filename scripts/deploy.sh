#!/bin/bash

# L2C 部署脚本
# 使用方式: 
#   ./deploy.sh deploy <version>  (e.g., ./deploy.sh deploy v1.0.1)
#   ./deploy.sh rollback <version> (e.g., ./deploy.sh rollback v1.0.0)

COMMAND=$1
VERSION=$2

if [ -z "$COMMAND" ] || [ -z "$VERSION" ]; then
    echo "Usage: ./deploy.sh [deploy|rollback] <version>"
    exit 1
fi

APP_NAME="l2c-app"
IMAGE_NAME="l2c-app"

function deploy() {
    echo "🚀 Starting deployment of version $VERSION..."
    
    # 1. 检查代码是否是最新的 (可选)
    # git pull origin main

    # 2. 修改 .env 或环境变量中的版本号 (这里演示写入 .env.production)
    # 实际生产中通常修改 docker-compose.yml 里的 image tag
    # e.g., sed -i "s/image: l2c-app:.*/image: l2c-app:$VERSION/g" docker-compose.yml
    
    echo "📦 Building Docker image..."
    docker build -t $IMAGE_NAME:$VERSION .
    docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest

    echo "🔄 Updating service..."
    # 使用 latest 或指定 version 启动
    # 如果使用了 Docker Hub/ACR，这里应该是 docker pull
    
    # 修改 compose 文件使用新版本 (示例: 仅为了演示逻辑，实际可能已由环境变量控制)
    # export APP_VERSION=$VERSION 
    
    docker-compose up -d --build app

    echo "✅ Deployment of $VERSION completed!"
}

function rollback() {
    echo "⏪ Rolling back to version $VERSION..."
    
    # 1. 确认该版本镜像是否存在
    if [[ "$(docker images -q $IMAGE_NAME:$VERSION 2> /dev/null)" == "" ]]; then
        echo "❌ Image $IMAGE_NAME:$VERSION not found locally."
        exit 1
    fi

    # 2. 停止当前容器
    # docker-compose stop app
    
    # 3. 启动旧版本
    echo "🔄 Restarting service with version $VERSION..."
    
    # 这里假设 docker-compose 能够接受外部 env 改变 image tag
    # IMAGE_TAG=$VERSION docker-compose up -d app
    
    # 简单回滚逻辑：重新打标 latest 为目标版本并重启
    docker tag $IMAGE_NAME:$VERSION $IMAGE_NAME:latest
    docker-compose up -d app
    
    echo "✅ Rollback to $VERSION completed!"
    echo "⚠️  注意: 数据库回滚需手动执行 drizzle/rollback 下的 SQL 脚本!"
}

if [ "$COMMAND" == "deploy" ]; then
    deploy
elif [ "$COMMAND" == "rollback" ]; then
    rollback
else
    echo "Unknown command: $COMMAND"
    exit 1
fi
