import postgres from 'postgres';

async function verify(label: string, connectionString: string) {
    const sql = postgres(connectionString, { max: 1 });
    console.log(`\n=== [${label}] 验证 ===`);
    try {
        const tables = await sql.unsafe<{ tablename: string }[]>(
            "SELECT tablename FROM pg_tables WHERE tablename IN ('tenant_members') AND schemaname='public'"
        );
        console.log('tenant_members 表存在:', tables.length > 0 ? '✅ 是' : '❌ 否');

        const cols = await sql.unsafe<{ column_name: string }[]>(
            "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='last_active_tenant_id'"
        );
        console.log('last_active_tenant_id 列存在:', cols.length > 0 ? '✅ 是' : '❌ 否');

        if (tables.length > 0) {
            const [cnt] = await sql.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM tenant_members');
            console.log('tenant_members 记录数:', cnt.cnt);
        }

        const [ucnt] = await sql.unsafe<{ cnt: string }[]>('SELECT COUNT(*) as cnt FROM users WHERE last_active_tenant_id IS NOT NULL');
        console.log('已填充 last_active_tenant_id 的用户数:', ucnt.cnt);
    } catch (e: any) {
        console.error('验证失败:', e.message);
    } finally {
        await sql.end();
    }
}

async function main() {
    await verify('本地库 (l2c_dev)', 'postgresql://l2c_user:password@127.0.0.1:5435/l2c_dev');
    await verify('生产库 (l2c)', 'postgresql://l2c:I%40rds2026@pgm-uf6aq31y169c8wvl.pg.rds.aliyuncs.com:5432/l2c');
}
main().catch(console.error);
