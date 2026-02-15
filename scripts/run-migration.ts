/**
 * 数据库迁移脚本：为 measure_tasks 表添加工费字段
 * 执行：npx tsx scripts/run-migration.ts
 */
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
    console.error('❌ DATABASE_URL 未设置');
    process.exit(1);
}

console.log('📦 正在连接数据库...');
console.log('   URL:', url.replace(/\/\/.*@/, '//*****@'));

const sql = postgres(url, { max: 1, connect_timeout: 10 });

async function migrate() {
    // 测试连接
    const [ping] = await sql`SELECT 1 as ok`;
    console.log('✅ 数据库连接成功\n');

    // 添加工费字段
    console.log('📋 执行迁移...');

    await sql.unsafe(`ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "labor_fee" numeric(12, 2)`);
    console.log('   ✓ labor_fee');

    await sql.unsafe(`ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "actual_labor_fee" numeric(12, 2)`);
    console.log('   ✓ actual_labor_fee');

    await sql.unsafe(`ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "adjustment_reason" text`);
    console.log('   ✓ adjustment_reason');

    await sql.unsafe(`ALTER TABLE "measure_tasks" ADD COLUMN IF NOT EXISTS "fee_breakdown" jsonb`);
    console.log('   ✓ fee_breakdown');

    // 验证
    const result = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'measure_tasks' 
          AND column_name IN ('labor_fee', 'actual_labor_fee', 'adjustment_reason', 'fee_breakdown')
    `;

    console.log(`\n✅ 迁移完成！验证结果（${result.length}/4 个字段）:`);
    result.forEach((r: any) => console.log(`   - ${r.column_name} (${r.data_type})`));

    await sql.end();
}

migrate().catch(async (e) => {
    console.error('❌ 迁移失败:', e.message);
    await sql.end();
    process.exit(1);
});
