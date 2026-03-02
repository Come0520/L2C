import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('❌ DATABASE_URL 未设置');
    process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function migrate() {
    console.log('📦 正在连接数据库并执行 0040 迁移...');

    // 读取 SQL 内容
    const sqlContent = fs.readFileSync('drizzle/0040_silent_shatterstar.sql', 'utf8');
    const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

    for (const statement of statements) {
        console.log(`执行: ${statement.substring(0, 50)}...`);
        try {
            await sql.unsafe(statement);
            console.log('✅ 成功');
        } catch (e: any) {
            console.error('❌ 失败:', e.message);
        }
    }

    await sql.end();
}

migrate().catch(async (e) => {
    console.error('❌ 脚本异常:', e.message);
    await sql.end();
    process.exit(1);
});
