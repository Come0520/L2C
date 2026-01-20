/**
 * 启用 PostgreSQL 行级安全 (RLS) 脚本
 * 
 * 功能：
 * 1. 为所有包含 tenant_id 的表启用 RLS
 * 2. 创建租户隔离策略
 * 
 * 执行命令: npx tsx scripts/enable-rls.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function enableRLS() {
    console.log('🔐 开始启用行级安全策略 (RLS)...\n');

    try {
        // 1. 查询所有包含 tenant_id 的表
        const tables = await sql`
            SELECT table_name
            FROM information_schema.columns
            WHERE column_name = 'tenant_id'
            AND table_schema = 'public'
            ORDER BY table_name
        `;

        console.log(`📋 发现 ${tables.length} 个表包含 tenant_id 字段:\n`);

        for (const { table_name } of tables) {
            try {
                // 2. 启用 RLS
                await sql.unsafe(`ALTER TABLE "${table_name}" ENABLE ROW LEVEL SECURITY`);

                // 3. 删除已有策略（允许重复执行）
                await sql.unsafe(`DROP POLICY IF EXISTS tenant_isolation_policy ON "${table_name}"`);

                // 4. 创建新策略
                await sql.unsafe(`
                    CREATE POLICY tenant_isolation_policy ON "${table_name}"
                    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
                `);

                // 5. 强制 RLS 对表所有者也生效 (可选，更严格)
                await sql.unsafe(`ALTER TABLE "${table_name}" FORCE ROW LEVEL SECURITY`);

                console.log(`  ✅ ${table_name}`);
            } catch (err) {
                console.log(`  ⚠️ ${table_name}: ${(err as Error).message}`);
            }
        }

        console.log('\n✅ RLS 启用完成！');
        console.log('\n📝 使用说明:');
        console.log('   在每次数据库查询前，需要设置租户上下文:');
        console.log('   SET app.current_tenant_id = \'<tenant-uuid>\';');

    } catch (err) {
        console.error('❌ 错误:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

enableRLS();
