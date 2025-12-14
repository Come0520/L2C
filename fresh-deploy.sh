#!/bin/bash

#############################################
# L2C 完全重新部署脚本
# 从零开始，完全干净的部署
#############################################

set -e  # 遇到错误立即停止

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 L2C 完全重新部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# 步骤1: 检查系统资源
echo "[1/9] 检查系统资源"
echo "CPU核数: $(nproc)"
echo "总内存: $(free -h | grep Mem | awk '{print $2}')"
echo "可用内存: $(free -h | grep Mem | awk '{print $7}')"
echo "磁盘空间: $(df -h /opt | tail -1 | awk '{print $4}') 可用"
echo

# 步骤2: 停止并清理旧应用
echo "[2/9] 停止并清理旧应用"
pm2 stop l2c 2>/dev/null || echo "没有运行中的应用"
pm2 delete l2c 2>/dev/null || echo "没有已注册的应用"
pm2 flush  # 清空日志
echo "✅ 旧应用已清理"
echo

# 步骤3: 完全删除旧代码
echo "[3/9] 删除旧代码"
if [ -d "/opt/l2c/L2C" ]; then
    echo "删除 /opt/l2c/L2C"
    rm -rf /opt/l2c/L2C
fi
echo "✅ 旧代码已删除"
echo

# 步骤4: 重新克隆代码
echo "[4/9] 克隆最新代码"
mkdir -p /opt/l2c
cd /opt/l2c
git clone https://github.com/Come0520/L2C.git
cd /opt/l2c/L2C/slideboard-frontend
echo "✅ 代码克隆完成"
echo

# 步骤5: 配置环境变量
echo "[5/9] 配置环境变量"
cat > .env.production << 'EOF'
# L2C 生产环境配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://www.luolai-sd.xin
NEXT_PUBLIC_SITE_URL=https://www.luolai-sd.xin

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://rdpiajialjnmngnaokix.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcGlhamlhbGpubW5nbmFva2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NTA4NjAsImV4cCI6MjA0OTEyNjg2MH0.0NzVI9zoIaiXxjyQ_4s08w_A4IyK8fL
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcGlhamlhbGpubW5nbmFva2l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzU1MDg2MCwiZXhwIjoyMDQ5MTI2ODYwfQ.5k6RlR3PqftG29R-yakSGg_z1w-JGHs
DATABASE_URL=postgresql://postgres:I@postgres2025@db.rdpiajialjnmngnaokix.supabase.co:5432/postgres

# 安全密钥
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://www.luolai-sd.xin
NEXTAUTH_URL_INTERNAL=http://localhost:3000

# 功能开关
ENABLE_SIGNUP=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_PASSWORD_RESET=true

# 日志
LOG_LEVEL=info
NEXT_TELEMETRY_DISABLED=1
EOF

echo "✅ 环境变量配置完成"
echo

# 步骤6: 安装依赖
echo "[6/9] 安装依赖"
npm install --ignore-scripts
echo "✅ 依赖安装完成"
echo

# 步骤7: 构建应用
echo "[7/9] 构建应用（预计10-20分钟，请耐心等待）"
export NODE_OPTIONS="--max-old-space-size=6144"
echo "内存限制: $NODE_OPTIONS"
NODE_ENV=production npm run build

# 验证构建是否成功
if [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ 构建失败！BUILD_ID 文件不存在"
    exit 1
fi

echo "✅ 构建成功完成"
echo "BUILD_ID: $(cat .next/BUILD_ID)"
echo

# 步骤8: 启动应用
echo "[8/9] 启动应用"
pm2 start npm --name "l2c" \
    --cwd /opt/l2c/L2C/slideboard-frontend \
    --node-args="--max-old-space-size=4096" \
    -- start

pm2 save
pm2 startup systemd -u root --hp /root

echo "等待应用启动..."
sleep 20
echo

# 步骤9: 验证部署
echo "[9/9] 验证部署"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PM2 状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏥 健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -I http://localhost:3000

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 应用日志（最近30行）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 logs l2c --lines 30 --nostream

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "访问应用："
echo "  🌐 http://101.132.152.132:3000"
echo "  🌐 http://www.luolai-sd.xin:3000"
echo
echo "常用命令："
echo "  查看状态: pm2 list"
echo "  查看日志: pm2 logs l2c"
echo "  重启应用: pm2 restart l2c"
echo "  停止应用: pm2 stop l2c"
echo
