#!/bin/bash

# Blue/Green 部署管理脚本
# 用于实现零停机部署、流量切换和快速回滚

# 配置参数
APP_NAME="l2c-web-app"
COMPOSE_FILE="docker-compose.production.yml"
NGINX_CONF="nginx/nginx.conf"
CURRENT_ENV_FILE=".current-env"
ACTION="${1:-deploy}"
IMAGE_TAG="${2:-latest}"
REGISTRY="${REGISTRY:-ghcr.io}"
REPOSITORY="${REPOSITORY:-${GITHUB_REPOSITORY}}"
IMAGE_NAME_FRONTEND="${IMAGE_NAME_FRONTEND:-luolai-l2c-frontend}"

# 颜色定义
BLUE="blue"
GREEN="green"

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 错误处理
error() {
  log "ERROR: $1"
  exit 1
}

# 检查当前活动环境
get_current_env() {
  if [ -f "$CURRENT_ENV_FILE" ]; then
    cat "$CURRENT_ENV_FILE"
  else
    # 默认使用 blue 作为初始环境
    echo "$BLUE"
  fi
}

# 获取目标环境（非活动环境）
get_target_env() {
  current=$(get_current_env)
  if [ "$current" = "$BLUE" ]; then
    echo "$GREEN"
  else
    echo "$BLUE"
  fi
}

# 设置当前环境
set_current_env() {
  echo "$1" > "$CURRENT_ENV_FILE"
  log "已设置当前环境为: $1"
}

# 部署新版本到目标环境
deploy_new_version() {
  target_env=$(get_target_env)
  current_env=$(get_current_env)
  
  log "开始部署新版本到 $target_env 环境..."
  log "当前活动环境: $current_env"
  
  # 拉取最新镜像
  log "拉取最新镜像..."
  docker pull "$REGISTRY/$REPOSITORY/$IMAGE_NAME_FRONTEND:$IMAGE_TAG" || error "镜像拉取失败"
  
  # 更新目标环境的镜像
  log "部署 $target_env 环境..."
  export IMAGE_TAG
  docker-compose -f "$COMPOSE_FILE" up -d "web-app-$target_env" || error "部署失败"
  
  # 等待服务启动
  log "等待 $target_env 环境启动..."
  sleep 20
  
  # 健康检查
  log "进行 $target_env 环境健康检查..."
  if ! docker exec "$APP_NAME-$target_env" node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"; then
    error "$target_env 环境健康检查失败，部署终止"
  fi
  
  log "新版本成功部署到 $target_env 环境"
  return 0
}

# 切换流量到目标环境
switch_traffic() {
  target_env=$(get_target_env)
  current_env=$(get_current_env)
  
  log "开始切换流量到 $target_env 环境..."
  
  # 更新 Nginx 配置，切换流量
  log "更新 Nginx 配置..."
  if [ "$target_env" = "$BLUE" ]; then
    # 切换到 blue
    sed -i 's/set \$app_env "green"/set \$app_env "blue"/' "$NGINX_CONF"
  else
    # 切换到 green
    sed -i 's/set \$app_env "blue"/set \$app_env "green"/' "$NGINX_CONF"
  fi
  
  # 测试 Nginx 配置
  log "测试 Nginx 配置..."
  docker exec l2c-nginx nginx -t || error "Nginx 配置错误"
  
  # 重新加载 Nginx
  log "重新加载 Nginx..."
  docker exec l2c-nginx nginx -s reload || error "Nginx 重载失败"
  
  # 更新当前环境标记
  set_current_env "$target_env"
  
  log "流量成功切换到 $target_env 环境"
  log "当前活动环境: $target_env"
  return 0
}

# 回滚到上一个环境
rollback() {
  current_env=$(get_current_env)
  target_env=$(get_target_env)
  
  log "开始回滚到 $target_env 环境..."
  log "当前活动环境: $current_env"
  
  # 检查目标环境是否健康
  log "检查 $target_env 环境健康状态..."
  if ! docker exec "$APP_NAME-$target_env" node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"; then
    log "警告: $target_env 环境不健康，但仍尝试回滚"
  fi
  
  # 切换流量
  switch_traffic
  
  log "回滚完成，当前活动环境: $(get_current_env)"
  return 0
}

# 清理旧版本
cleanup_old_version() {
  current_env=$(get_current_env)
  if [ "$current_env" = "$BLUE" ]; then
    old_env="$GREEN"
  else
    old_env="$BLUE"
  fi
  
  log "清理旧版本环境 $old_env..."
  
  # 停止旧版本容器
  docker-compose -f "$COMPOSE_FILE" stop "web-app-$old_env" || error "停止旧版本容器失败"
  
  # 删除旧版本容器
  docker-compose -f "$COMPOSE_FILE" rm -f "web-app-$old_env" || error "删除旧版本容器失败"
  
  log "旧版本环境 $old_env 清理完成"
  return 0
}

# 显示状态
show_status() {
  current_env=$(get_current_env)
  target_env=$(get_target_env)
  
  log "===== 部署状态 ====="
  log "当前活动环境: $current_env"
  log "目标环境: $target_env"
}

# 主入口
case "$ACTION" in
  deploy)
    deploy_new_version && switch_traffic
    ;;
  rollback)
    rollback
    ;;
  finalize)
    cleanup_old_version
    ;;
  status)
    show_status
    ;;
  *)
    echo "用法: $0 [deploy|rollback|finalize|status] [image_tag]"
    exit 1
    ;;
esac
