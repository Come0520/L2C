#!/bin/bash

#############################################
# 在阿里云 Workbench 中执行此脚本
# 升级配置后完成部署
#############################################

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "L2C 最终部署（升级后）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 1. 检查系统配置
echo "[1/5] 检查系统配置"
echo "CPU核数: $(nproc)"
echo "总内存: $(free -h | grep Mem | awk '{print $2}')"
echo "可用内存: $(free -h | grep Mem | awk '{print $7}')"
echo

# 2. 进入项目目录
echo "[2/5] 进入项目目录"
cd /opt/l2c/L2C/slideboard-frontend
pwd
echo

# 3. 停止旧应用
echo "[3/5] 停止旧应用"
pm2 stop l2c 2>/dev/null || echo "无旧应用"
pm2 delete l2c 2>/dev/null || echo "已清理"
echo

# 4. 构建应用（使用6GB堆内存）
echo "[4/5] 开始构建（约10分钟，请耐心等待）"
export NODE_OPTIONS="--max-old-space-size=6144"
echo "内存限制: $NODE_OPTIONS"
NODE_ENV=production npm run build
echo "✅ 构建完成"
echo

# 5. 启动应用
echo "[5/5] 启动应用"
pm2 start npm --name "l2c" --node-args="--max-old-space-size=4096" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# 等待启动
sleep 20

# 查看状态
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "服务状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "应用日志"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs l2c --lines 20 --nostream

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试应用"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -I http://localhost:3000

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "访问应用："
echo "  🌐 http://101.132.152.132:3000"
echo "  🌐 http://www.luolai-sd.xin:3000"
echo
