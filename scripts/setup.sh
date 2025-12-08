#!/usr/bin/env bash

# 安装脚本 - 自动安装Supabase CLI和其他依赖

echo "🚀 开始安装L2C项目依赖..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null
then
    echo "❌ Node.js 未安装"
    echo "请先安装Node.js 18.0+"
    exit 1
else
    echo "✅ Node.js 已安装: $(node --version)"
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null
then
    echo "❌ npm 未安装"
    echo "请先安装npm"
    exit 1
else
    echo "✅ npm 已安装: $(npm --version)"
fi

# 安装Supabase CLI
echo "📦 安装Supabase CLI..."
npm install -g supabase
if [ $? -eq 0 ]; then
    echo "✅ Supabase CLI 安装成功: $(supabase --version)"
else
    echo "❌ Supabase CLI 安装失败"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd "$(dirname -- "$0")/../slideboard-frontend"
npm install
if [ $? -eq 0 ]; then
    echo "✅ 前端依赖安装成功"
else
    echo "❌ 前端依赖安装失败"
    exit 1
fi

# 配置环境变量
echo "⚙️ 配置环境变量..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
fi

# 返回项目根目录
cd "$(dirname -- "$0")/.."

# 启动Supabase服务
echo "🚀 启动Supabase服务..."
supabase start
if [ $? -eq 0 ]; then
    echo "✅ Supabase服务启动成功"
else
    echo "❌ Supabase服务启动失败"
    exit 1
fi

echo "🎉 安装完成！"
echo "📖 访问 http://localhost:3000 开始使用"
echo "💡 运行以下命令启动前端开发服务器:"
echo "   cd slideboard-frontend && npm run dev"