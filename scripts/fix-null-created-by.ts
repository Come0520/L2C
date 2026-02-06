// 临时脚本：修复 customers 表中 created_by 为 null 的数据
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function fixCustomersData() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL not set');
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    try {
        // 1. 更新 customers 表中 created_by 为 null 的记录
        const result1 = await db.execute(sql`
            UPDATE customers 
            SET created_by = (
                SELECT id FROM users 
                WHERE tenant_id = customers.tenant_id 
                AND role = 'ADMIN' 
                LIMIT 1
            ) 
            WHERE created_by IS NULL
        `);
        console.log('✅ 已修复 customers.created_by:', result1);

        // 2. 更新 leads 表中 created_by 为 null 的记录
        const result2 = await db.execute(sql`
            UPDATE leads 
            SET created_by = (
                SELECT id FROM users 
                WHERE tenant_id = leads.tenant_id 
                AND role = 'ADMIN' 
                LIMIT 1
            ) 
            WHERE created_by IS NULL
        `);
        console.log('✅ 已修复 leads.created_by:', result2);

        // 3. 更新 orders 表中 created_by 为 null 的记录
        const result3 = await db.execute(sql`
            UPDATE orders 
            SET created_by = (
                SELECT id FROM users 
                WHERE tenant_id = orders.tenant_id 
                AND role = 'ADMIN' 
                LIMIT 1
            ) 
            WHERE created_by IS NULL
        `);
        console.log('✅ 已修复 orders.created_by:', result3);

        // 4. 更新 quotes 表中 created_by 为 null 的记录
        const result4 = await db.execute(sql`
            UPDATE quotes 
            SET created_by = (
                SELECT id FROM users 
                WHERE tenant_id = quotes.tenant_id 
                AND role = 'ADMIN' 
                LIMIT 1
            ) 
            WHERE created_by IS NULL
        `);
        console.log('✅ 已修复 quotes.created_by:', result4);

        console.log('🎉 所有数据修复完成！请重新运行 drizzle-kit push');

    } catch (error) {
        console.error('❌ 修复失败:', error);
    } finally {
        await client.end();
    }
}

fixCustomersData();
