import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
    // 1. 查询 conditions 列的实际类型
    const cols = await sql`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns 
    WHERE column_name = 'conditions' 
    AND table_schema = 'public'
  `;
    console.log('=== conditions 列的当前类型 ===');
    console.log(JSON.stringify(cols, null, 2));

    // 2. 对非 jsonb 类型的列执行 ALTER
    for (const col of cols) {
        if (col.udt_name !== 'jsonb') {
            console.log(`\n修复表 ${col.table_name}: ${col.data_type} -> jsonb`);
            await sql.unsafe(
                `ALTER TABLE "${col.table_name}" ALTER COLUMN "conditions" TYPE jsonb USING conditions::jsonb`
            );
            console.log(`✅ 表 ${col.table_name}.conditions 已修复为 jsonb`);
        } else {
            console.log(`✅ 表 ${col.table_name}.conditions 已经是 jsonb，无需修复`);
        }
    }

    await sql.end();
    console.log('\n完成！');
}

main().catch((err) => {
    console.error('执行失败:', err);
    process.exit(1);
});
