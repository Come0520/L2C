#!/usr/bin/env node
/**
 * 查询 user_role 枚举的所有引用列
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL 未设置');

const client = postgres(DATABASE_URL, { onnotice: () => { } });
const db = drizzle(client);

async function main() {
    // 查询所有使用 user_role 枚举的列
    const refs = await db.execute(sql`
    SELECT c.table_name, c.column_name, c.data_type, c.udt_name
    FROM information_schema.columns c
    WHERE c.udt_name = 'user_role'
    AND c.table_schema = 'public'
    ORDER BY c.table_name
  `);
    console.log('使用 user_role 枚举的所有列：');
    console.table(refs.rows ?? refs);

    // 查询当前枚举的所有值
    const enumVals = await db.execute(sql`
    SELECT enumlabel FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ORDER BY enumsortorder
  `);
    console.log('\n当前 user_role 枚举值：');
    console.table(enumVals.rows ?? enumVals);

    await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
