#!/bin/bash
# ============================================================
# ECS 数据库查询工具
# 用法: ssh ecs "bash /root/L2C/scripts/ecs-db-query.sh '<SQL>'"
# 示例: ssh ecs "bash /root/L2C/scripts/ecs-db-query.sh 'SELECT count(*) FROM users'"
#
# 注意: SQL 中的单引号请用双单引号 '' 替代，
#       或者将 SQL 写入文件后用 -f 参数执行
# ============================================================

set -euo pipefail

SQL="${1:?用法: ecs-db-query.sh '<SQL语句>'}"

# 写临时 JS 到宿主机
TMPJS=$(mktemp /tmp/dbq_XXXXX.js)

# 使用单引号 heredoc (<<'EOF') 防止 bash 展开
# SQL 通过环境变量传入，避免引号转义问题
cat > "$TMPJS" << 'ENDSCRIPT'
const postgres = require('/app/node_modules/postgres');
const sql = postgres(process.env.DATABASE_URL);
const query = process.env.DBQ_SQL;
sql.unsafe(query).then(rows => {
  if (rows.length === 0) { console.log('(空结果)'); }
  else { console.table(rows); }
  process.exit(0);
}).catch(e => { console.error('❌ SQL 错误:', e.message); process.exit(1); });
ENDSCRIPT

# 复制到容器内，修复权限后执行（SQL 通过环境变量传入）
docker cp "$TMPJS" l2c-app:/tmp/dbquery.js
docker exec -u 0 l2c-app chmod 644 /tmp/dbquery.js
docker exec -e "DBQ_SQL=$SQL" l2c-app node /tmp/dbquery.js
EXIT_CODE=$?

# 清理
rm -f "$TMPJS"
docker exec -u 0 l2c-app rm -f /tmp/dbquery.js 2>/dev/null || true

exit $EXIT_CODE
