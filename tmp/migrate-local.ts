import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 SQL 文件并只取前 3 个非注释语句（阶段1建表+索引）
const rawSql = readFileSync(join(process.cwd(), 'drizzle/0040_multi_tenant_members.sql'), 'utf8');

// 逐条分割并执行
const statements = rawSql
    .replace(/--[^\n]*/g, '') // 去掉行注释
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 5);

const LOCAL_URL = 'postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev';

async function main() {
    const sql = postgres(LOCAL_URL, { max: 5, connect_timeout: 10 });

    // 先测试连接
    try {
        const [test] = await sql.unsafe<{ now: string }[]>('SELECT NOW() as now');
        console.log('✅ 连接成功，当前时间:', test.now);

        // 检查 users 表是否存在
        const tables = await sql.unsafe<{ tablename: string }[]>(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
        );
        console.log('已有的表:', tables.map(t => t.tablename).join(', '));
    } catch (e: any) {
        console.error('❌ 连接失败:', e.message);
        await sql.end();
        process.exit(1);
    }

    // 逐条执行
    let i = 0;
    for (const stmt of statements) {
        i++;
        try {
            await sql.unsafe(stmt);
            const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
            console.log(`  [${i}] ✓ 执行: ${preview}...`);
        } catch (e: any) {
            const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
            if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
                console.log(`  [${i}] ℹ 已存在跳过: ${preview}`);
            } else {
                console.error(`  [${i}] ❌ 失败: ${e.message}`);
                console.error(`    SQL: ${preview}`);
            }
        }
    }

    // 最终验证
    try {
        const [r1] = await sql.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM tenant_members');
        const [r2] = await sql.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM users WHERE last_active_tenant_id IS NOT NULL');
        console.log('\n🎉 验证结果:');
        console.log('  tenant_members 记录数:', r1.cnt);
        console.log('  last_active_tenant_id 已填充用户数:', r2.cnt);
    } catch (e: any) {
        console.error('验证查询失败:', e.message);
    }

    await sql.end();
}

main().catch(console.error);
