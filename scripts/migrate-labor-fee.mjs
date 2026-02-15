/**
 * 手动迁移脚本：为 measure_tasks 表添加工费字段
 * 执行：node scripts/migrate-labor-fee.mjs
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env') });

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
    try {
        console.log('🚀 开始迁移：添加 measure_tasks 工费字段...\n');

        // 添加工费相关字段
        await sql`
            ALTER TABLE measure_tasks 
            ADD COLUMN IF NOT EXISTS labor_fee numeric(12, 2)
        `;
        console.log('✅ 添加 labor_fee 字段');

        await sql`
            ALTER TABLE measure_tasks 
            ADD COLUMN IF NOT EXISTS actual_labor_fee numeric(12, 2)
        `;
        console.log('✅ 添加 actual_labor_fee 字段');

        await sql`
            ALTER TABLE measure_tasks 
            ADD COLUMN IF NOT EXISTS adjustment_reason text
        `;
        console.log('✅ 添加 adjustment_reason 字段');

        await sql`
            ALTER TABLE measure_tasks 
            ADD COLUMN IF NOT EXISTS fee_breakdown jsonb
        `;
        console.log('✅ 添加 fee_breakdown 字段');

        // 验证字段已添加
        const result = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'measure_tasks' 
              AND column_name IN ('labor_fee', 'actual_labor_fee', 'adjustment_reason', 'fee_breakdown')
            ORDER BY column_name
        `;

        console.log('\n📋 验证结果：');
        console.table(result);

        console.log('\n✅ 迁移完成！');
    } catch (error) {
        console.error('❌ 迁移失败：', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

migrate();
