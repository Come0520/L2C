#!/bin/bash

#############################################
# 本地构建并上传到 ECS
#############################################

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "本地构建 L2C 应用"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 1. 进入项目目录
cd slideboard-frontend
echo "[1/6] 当前目录: $(pwd)"
echo

# 2. 构建应用
echo "[2/6] 开始构建（约5-10分钟）..."
NODE_ENV=production npm run build
echo "✅ 构建完成"
echo

# 3. 打包.next文件夹
echo "[3/6] 打包构建结果..."
tar -czf next-build.tar.gz .next
echo "✅ 打包完成: $(ls -lh next-build.tar.gz)"
echo

# 4. 上传到服务器
echo "[4/6] 上传到ECS..."
scp -i ~/.ssh/ecs-l2c-deploy next-build.tar.gz \
  root@101.132.152.132:/opt/l2c/L2C/slideboard-frontend/
echo "✅ 上传完成"
echo

# 5. 在服务器上解压并启动
echo "[5/6] 在服务器上部署..."
ssh -i ~/.ssh/ecs-l2c-deploy root@101.132.152.132 'bash -s' << 'ENDSSH'
cd /opt/l2c/L2C/slideboard-frontend

# 解压
tar -xzf next-build.tar.gz
echo "✅ 解压完成"

# 停止旧应用
pm2 stop l2c 2>/dev/null || true
pm2 delete l2c 2>/dev/null || true

# 启动应用
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start
pm2 save

sleep 15

# 查看状态
pm2 list
curl -I http://localhost:3000

ENDSSH

echo "[6/6] 验证完成"
echo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署成功！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "访问应用："
echo "  🌐 http://101.132.152.132:3000"
echo "  🌐 http://www.luolai-sd.xin:3000"
