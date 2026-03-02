import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const rawSql = readFileSync(join(process.cwd(), 'drizzle/0040_multi_tenant_members.sql'), 'utf8');

const statements = rawSql
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 5);

const PROD_URL = 'postgresql://l2c:I%40rds2026@pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com:5432/l2c';

async function main() {
    console.log('[生产库] 开始连接...');
    const sql = postgres(PROD_URL, { max: 3, connect_timeout: 15 });

    try {
        const [t] = await sql.unsafe<{ now: string }[]>('SELECT NOW() as now');
        console.log('[生产库] ✅ 连接成功:', t.now);
    } catch (e: any) {
        console.error('[生产库] ❌ 连接失败:', e.message);
        process.exit(1);
    }

    let i = 0;
    for (const stmt of statements) {
        i++;
        try {
            await sql.unsafe(stmt);
            console.log(`  [${i}] ✓ ${stmt.substring(0, 70).replace(/\s+/g, ' ')}`);
        } catch (e: any) {
            if (e.code === '42P07' || e.code === '42701' || e.message?.includes('already exists')) {
                console.log(`  [${i}] ℹ 已存在跳过: ${stmt.substring(0, 50).replace(/\s+/g, ' ')}`);
            } else {
                console.error(`  [${i}] ❌ [${e.code}]: ${e.message?.substring(0, 100)}`);
            }
        }
    }

    try {
        const [r1] = await sql.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM tenant_members');
        const [r2] = await sql.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM users WHERE last_active_tenant_id IS NOT NULL');
        console.log('\n🎉 [生产库] 验证:');
        console.log('  tenant_members 记录数:', r1.cnt);
        console.log('  last_active_tenant_id 已填充:', r2.cnt);
    } catch (e: any) {
        console.error('验证失败:', e.message);
    }

    await sql.end();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
