import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL 未设置'); process.exit(1); }

const sql = postgres(DATABASE_URL);

async function main() {
    // 查询 leads 表实际列
    const cols = await sql`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    ORDER BY ordinal_position
  `;

    const dbColumns = cols.map(r => r.column_name as string);
    console.log(`\n=== DB leads 表列数: ${dbColumns.length} ===`);
    for (const row of cols) {
        console.log(`  ${row.column_name} (${row.data_type}, ${row.is_nullable})`);
    }

    // Schema 定义的列
    const schemaColumns = [
        'id', 'tenant_id', 'lead_no', 'customer_name', 'customer_phone',
        'customer_wechat', 'address', 'community', 'house_type',
        'status', 'intention_level',
        'channel_id', 'channel_contact_id', 'source_channel_id', 'source_sub_id',
        'distribution_rule_id', 'source_detail', 'url_params', 'referrer_name', 'referrer_customer_id',
        'estimated_amount', 'tags', 'notes', 'lost_reason', 'score',
        'import_batch_id', 'raw_data',
        'external_id',
        'assigned_sales_id', 'assigned_at',
        'last_activity_at', 'next_followup_at', 'next_followup_recommendation',
        'decoration_progress',
        'quoted_at', 'visited_store_at', 'won_at',
        'customer_id',
        'created_by', 'updated_by', 'created_at', 'updated_at', 'version', 'deleted_at'
    ];

    const missing = schemaColumns.filter(c => !dbColumns.includes(c));
    const extra = dbColumns.filter(c => !schemaColumns.includes(c));

    console.log(`\n=== Schema 定义列数: ${schemaColumns.length} ===`);
    if (missing.length > 0) {
        console.log(`\n❌ Schema 中有但 DB 缺失的列:\n  ${missing.join('\n  ')}`);
    } else {
        console.log(`\n✅ 所有 Schema 列在 DB 中都存在`);
    }
    if (extra.length > 0) {
        console.log(`\nℹ️ DB 额外列:\n  ${extra.join('\n  ')}`);
    }

    // 查枚举
    const enums = await sql`
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('lead_status', 'intention_level', 'decoration_progress')
    ORDER BY t.typname, e.enumsortorder
  `;
    console.log(`\n=== 枚举值 ===`);
    for (const row of enums) {
        console.log(`  ${row.typname}: ${row.enumlabel}`);
    }

    await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
