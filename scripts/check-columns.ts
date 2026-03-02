import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    // 尝试从 .env.local 读取
    const fs = require('fs');
    const envLocal = fs.readFileSync('.env.local', 'utf-8');
    const match = envLocal.match(/DATABASE_URL="?([^"\n]+)"?/);
    if (match) {
        process.env.DATABASE_URL = match[1];
    } else {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }
}

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
    const columns = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'tenants' 
    ORDER BY ordinal_position
  `;
    console.log('=== tenants 表的列 ===');
    for (const row of columns) {
        console.log(`  - ${row.column_name}`);
    }

    // 检查是否有 is_grandfathered 列
    const hasColumn = columns.some(r => r.column_name === 'is_grandfathered');
    console.log(`\nis_grandfathered 列是否存在: ${hasColumn ? '✅ 存在' : '❌ 不存在'}`);

    // 检查迁移状态
    try {
        const migrations = await sql`
      SELECT hash, created_at FROM drizzle."__drizzle_migrations" 
      ORDER BY created_at DESC LIMIT 5
    `;
        console.log('\n=== 最近5条迁移记录 ===');
        for (const m of migrations) {
            console.log(`  - hash: ${m.hash}, created_at: ${m.created_at}`);
        }
    } catch (e) {
        console.log('\n迁移表查询失败:', (e as Error).message);
    }

    await sql.end();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
