#!/bin/bash

# L2C 线索管理系统开发环境启动脚本

echo "🚀 启动 L2C 线索管理系统开发环境..."

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 项目目录: $PROJECT_ROOT"

# 检查依赖是否已安装
if [ ! -d "slideboard-frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd slideboard-frontend && npm install
    cd ..
fi

if [ ! -d "slideboard-backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd slideboard-backend && npm install
    cd ..
fi

# 检查环境变量文件
if [ ! -f "slideboard-frontend/.env" ]; then
    echo "⚙️  创建前端环境变量文件..."
    cp slideboard-frontend/.env.example slideboard-frontend/.env
fi

if [ ! -f "slideboard-backend/.env" ]; then
    echo "⚙️  创建后端环境变量文件..."
    cp slideboard-backend/.env.example slideboard-backend/.env
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
cd slideboard-backend
if [ ! -f "prisma/dev.db" ]; then
    npx prisma generate
    npx prisma db push
    npx prisma db seed
fi
cd ..

echo "🎉 环境准备完成！"
echo ""
echo "📋 服务信息:"
echo "   前端服务: http://localhost:3000"
echo "   后端API: http://localhost:3001"
echo "   数据库管理: http://localhost:5555"
echo ""
echo "🔧 启动服务..."

# 使用 trap 确保脚本退出时杀死所有子进程
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# 启动后端服务
echo "🟢 启动后端服务..."
cd slideboard-backend
npm run dev &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务
echo "🔵 启动前端服务..."
cd ../slideboard-frontend
npm run dev &
FRONTEND_PID=$!

# 可选：启动数据库管理界面
if [ "$1" = "--with-studio" ]; then
    echo "🟡 启动数据库管理界面..."
    cd ../slideboard-backend
    npx prisma studio --port 5555 &
    STUDIO_PID=$!
fi

echo ""
echo "✨ 所有服务已启动！"
echo ""
echo "📖 使用说明:"
echo "   - 访问 http://localhost:3000 使用系统"
echo "   - 开发模式下无需登录，直接进入线索管理"
echo "   - 按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
wait
