#!/usr/bin/env bash

# 检查Supabase CLI是否安装
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI 未安装"
    echo "请安装Supabase CLI: npm install -g supabase"
    exit 1
else
    echo "✅ Supabase CLI 已安装"
    exit 0
fi