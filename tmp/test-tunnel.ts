/**
 * 通过 SSH 隧道连接 RDS (localhost:15432) 执行 drizzle-kit push
 */
import postgres from 'postgres';

async function testTunnel() {
    // 通过SSH隧道连接 - 无需SSL因为隧道已加密
    const sql = postgres({
        host: '127.0.0.1',
        port: 15432,
        database: 'l2c',
        username: 'l2c',
        password: 'I@rds2026',
        ssl: false,
        max: 1,
        connect_timeout: 10,
    });

    try {
        console.log('测试通过SSH隧道连接RDS...');
        const result = await sql`SELECT version()`;
        console.log('✅ 连接成功！版本:', result[0].version);

        const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 5`;
        console.log('前5张表:', tables.map((r: any) => r.tablename));

    } finally {
        await sql.end();
    }
}

testTunnel().catch(e => {
    console.error('❌ 连接失败:', e.message);
    process.exit(1);
});
