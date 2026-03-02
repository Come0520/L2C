import { db } from './src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    const cols = await db.execute(sql`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'verification_codes' 
    ORDER BY ordinal_position
  `);
    console.log('=== verification_codes 表结构 ===');
    console.log(JSON.stringify(cols, null, 2));

    const enumVals = await db.execute(sql`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'verification_code_type'
    ORDER BY e.enumsortorder
  `);
    console.log('\n=== verification_code_type 枚举值 ===');
    console.log(JSON.stringify(enumVals, null, 2));

    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
