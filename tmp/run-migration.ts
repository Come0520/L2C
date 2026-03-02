import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = readFileSync(join(process.cwd(), 'drizzle/0040_multi_tenant_members.sql'), 'utf8');

// 将脚本拆分为单个语句（postgres 驱动需要逐条执行 DDL）
// 过滤注释和空语句
const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

async function runMigration(label: string, connectionString: string) {
    const client = postgres(connectionString, { max: 1 });
    console.log(`\n========================================`);
    console.log(`[${label}] 开始迁移...`);
    try {
        for (const stmt of statements) {
            if (!stmt.trim()) continue;
            try {
                await client.unsafe(stmt);
                // 打印第一行关键词
                const firstWord = stmt.trim().split(/\s+/)[0].toUpperCase();
                console.log(`  ✓ ${firstWord}...`);
            } catch (e: any) {
                // 如果是"已存在"类型的错误，仅警告而不中断
                if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
                    console.log(`  ℹ 已存在，跳过: ${e.message.substring(0, 60)}`);
                } else {
                    throw e;
                }
            }
        }

        console.log(`[${label}] ✅ 迁移成功！`);

        const [r1] = await client.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM tenant_members');
        console.log(`[${label}] tenant_members 记录数: ${r1.cnt}`);

        const [r2] = await client.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM users WHERE last_active_tenant_id IS NOT NULL');
        console.log(`[${label}] users.last_active_tenant_id 已填充数: ${r2.cnt}`);
    } catch (e: any) {
        console.error(`[${label}] ❌ 迁移失败:`, e.message);
    } finally {
        await client.end();
    }
}

const LOCAL_URL = 'postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev';
const PROD_URL = 'postgresql://l2c:I%40rds2026@pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com:5432/l2c';

async function main() {
    await runMigration('本地库 (l2c_dev)', LOCAL_URL);
    await runMigration('生产库 (l2c)', PROD_URL);
    console.log('\n========================================');
    console.log('全部完成！');
}

main().catch(console.error);
