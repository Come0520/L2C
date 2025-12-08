#!/bin/bash

# VibeCoding 敏捷5S规则 - 代码清理脚本
# 用于定期清理未使用依赖与死代码

echo "🚀 开始执行代码清理..."

echo "\n📁 进入前端项目目录..."
cd "$(dirname "$0")/../slideboard-frontend"

# 检查依赖
echo "\n🔍 检查未使用的依赖..."
npm run clean:unused

# 检查死代码
echo "\n🔍 检查死代码..."
npm run clean:deadcode

# 清理 node_modules 并重新安装（可选，根据需要取消注释）
# echo "\n🧹 清理 node_modules 并重新安装依赖..."
# rm -rf node_modules package-lock.json
# npm install

echo "\n🎉 代码清理完成！"
echo "\n📋 建议："
echo "1. 检查并删除未使用的依赖"
echo "2. 检查并删除死代码"
echo "3. 定期运行此脚本以保持代码清洁"
