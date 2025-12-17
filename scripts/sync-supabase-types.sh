#!/bin/bash
# 同步 Supabase 类型到前端
# 用法: ./scripts/sync-supabase-types.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Generating Supabase types..."
cd "$PROJECT_ROOT"

# 检查 Supabase 是否运行
if ! npx supabase status &>/dev/null; then
    echo "❌ Supabase is not running. Please start it with 'npx supabase start'"
    exit 1
fi

# 生成类型
npx supabase gen types typescript --local > slideboard-frontend/src/types/supabase.ts

# 检查是否有 prettier
if command -v npx &>/dev/null && [ -f "slideboard-frontend/node_modules/.bin/prettier" ]; then
    echo "✨ Formatting generated types..."
    cd slideboard-frontend
    npx prettier --write src/types/supabase.ts
    cd ..
fi

echo "✅ Types synced to slideboard-frontend/src/types/supabase.ts"
echo ""
echo "📋 Summary:"
echo "   - Generated from: local Supabase instance"
echo "   - Output: slideboard-frontend/src/types/supabase.ts"
echo "   - Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
