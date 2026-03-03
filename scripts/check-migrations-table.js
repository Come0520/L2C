const postgres = require('/app/node_modules/postgres');
const sql = postgres(process.env.DATABASE_URL);

async function run() {
    try {
        // 先检查迁移表是否存在
        const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '__drizzle_migrations'
      ) as exists
    `;

        if (!tableExists[0].exists) {
            console.log('__drizzle_migrations 表不存在（生产库从未运行过 migrate 命令）');
            process.exit(0);
        }

        const rows = await sql`SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at`;
        console.log(`迁移记录共 ${rows.length} 条：`);
        rows.forEach((r, i) => console.log(`  [${i}] hash=${r.hash} at=${r.created_at}`));
    } catch (err) {
        console.error('错误：', err.message);
    } finally {
        process.exit(0);
    }
}

run();
