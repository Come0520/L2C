import 'dotenv/config';
import postgres from 'postgres';

/**
 * 通用列类型修复脚本
 * 解决 drizzle-kit push 无法自动处理的列类型转换问题
 * 每个修复项格式: { table, column, targetType, using }
 */

const sql = postgres(process.env.DATABASE_URL!);

interface ColumnFix {
    table: string;
    column: string;
    targetType: string;
    using: string;
}

// 需要修复的列列表（根据 drizzle-kit push 报错逐一添加）
const fixes: ColumnFix[] = [
    // retry_count 列（可能在通知相关表中）
    {
        table: '', // 待查
        column: 'retry_count',
        targetType: 'integer',
        using: 'retry_count::integer',
    },
];

async function main() {
    // 第一步：查找所有需要修复的列
    console.error('=== 查找数据库中类型不匹配的列 ===\n');

    // retry_count 列
    const retryCols = await sql`
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns 
    WHERE column_name = 'retry_count' 
    AND table_schema = 'public'
    AND udt_name != 'int4'
  `;

    for (const col of retryCols) {
        console.error(`修复 ${col.table_name}.retry_count: ${col.data_type} -> integer`);
        await sql.unsafe(`ALTER TABLE "${col.table_name}" ALTER COLUMN "retry_count" DROP DEFAULT`);
        await sql.unsafe(`ALTER TABLE "${col.table_name}" ALTER COLUMN "retry_count" TYPE integer USING retry_count::integer`);
        await sql.unsafe(`ALTER TABLE "${col.table_name}" ALTER COLUMN "retry_count" SET DEFAULT 0`);
        console.error(`✅ 已修复`);
    }

    // 检查所有可能有问题的列类型 —— 一次性扫描常见的名称
    const checks = [
        { column: 'sort_order', expectedUdt: 'int4', targetType: 'integer' },
        { column: 'max_retries', expectedUdt: 'int4', targetType: 'integer' },
        { column: 'priority', expectedUdt: 'int4', targetType: 'integer' },
        { column: 'split_count', expectedUdt: 'int4', targetType: 'integer' },
        { column: 'metadata', expectedUdt: 'jsonb', targetType: 'jsonb' },
        { column: 'config', expectedUdt: 'jsonb', targetType: 'jsonb' },
        { column: 'payload', expectedUdt: 'jsonb', targetType: 'jsonb' },
        { column: 'rules', expectedUdt: 'jsonb', targetType: 'jsonb' },
    ];

    for (const check of checks) {
        const mismatch = await sql`
      SELECT table_name, column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE column_name = ${check.column}
      AND table_schema = 'public'
      AND udt_name != ${check.expectedUdt}
    `;

        for (const col of mismatch) {
            console.error(`修复 ${col.table_name}.${check.column}: ${col.data_type} -> ${check.targetType}`);
            try {
                await sql.unsafe(`ALTER TABLE "${col.table_name}" ALTER COLUMN "${check.column}" DROP DEFAULT`);
            } catch { /* 可能没有默认值 */ }

            const usingClause = check.targetType === 'jsonb'
                ? `${check.column}::jsonb`
                : `${check.column}::${check.targetType}`;

            await sql.unsafe(
                `ALTER TABLE "${col.table_name}" ALTER COLUMN "${check.column}" TYPE ${check.targetType} USING ${usingClause}`
            );
            console.error(`✅ 已修复`);
        }
    }

    await sql.end();
    console.error('\n全部完成！');
}

main().catch((err) => {
    console.error('执行失败:', err);
    process.exit(1);
});
