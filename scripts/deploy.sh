#!/bin/bash
# ==============================================
# L2C 生产环境部署脚本
# 由 CodeUp Flow 触发执行
# ==============================================

set -e

echo "=== L2C 生产部署开始 ==="
echo "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"

# ------------------------------------------
# 1. 检查并设置 Swap（防止 OOM）
# ------------------------------------------
echo "[1/6] 检查 Swap 状态..."
if swapon --show | grep -q "/swapfile"; then
  echo "✓ Swap 已激活"
  free -h
elif [ -f /swapfile ]; then
  echo "Swapfile 存在但未激活，正在激活..."
  swapon /swapfile || {
    echo "激活失败，正在重建..."
    swapoff /swapfile 2>/dev/null || true
    rm -f /swapfile
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
  }
  echo "✓ Swap 已激活"
  free -h
else
  echo "正在创建 4GB Swap..."
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "✓ Swap 已创建并激活"
  free -h
fi

# ------------------------------------------
# 2. 备份 .env 文件
# ------------------------------------------
echo "[2/6] 备份 .env 文件..."
if [ -f /opt/L2C/.env ]; then
  cp /opt/L2C/.env /tmp/L2C.env.bak
  echo "✓ .env 已备份到 /tmp/L2C.env.bak"
else
  echo "⚠ 未找到 .env 文件，跳过备份"
fi

# ------------------------------------------
# 3. 拉取最新代码
# ------------------------------------------
echo "[3/6] 拉取最新代码..."
cd /opt/L2C

# 确保 remote 正确配置
if ! git remote | grep -q "origin"; then
  echo "配置远程仓库..."
  git remote add origin git@codeup.aliyun.com:697359d3b28d0aba0f5e4ff2/l2c.git
fi

git fetch origin main
git reset --hard origin/main
echo "✓ 代码已更新到最新版本"
git log --oneline -1

# ------------------------------------------
# 4. 恢复 .env 文件
# ------------------------------------------
echo "[4/6] 恢复 .env 文件..."
if [ -f /tmp/L2C.env.bak ]; then
  cp /tmp/L2C.env.bak /opt/L2C/.env
  echo "✓ .env 已恢复"
else
  echo "⚠ 未找到备份的 .env 文件"
fi

# ------------------------------------------
# 5. 重建并重启 Docker 容器
# ------------------------------------------
echo "[5/6] 重建 Docker 容器..."
docker compose -f docker-compose.prod.yml build

echo "[5/6] 重启服务..."
docker compose -f docker-compose.prod.yml up -d

# ------------------------------------------
# 6. 清理无用镜像
# ------------------------------------------
echo "[6/6] 清理无用镜像..."
docker image prune -f

# ------------------------------------------
# 完成报告
# ------------------------------------------
echo ""
echo "=== 部署完成 ==="
echo "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "服务状态:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "健康检查:"
sleep 5
curl -sf http://localhost:3000/api/health && echo "✓ 服务健康" || echo "✗ 服务异常"
