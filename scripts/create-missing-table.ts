import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('[DEBUG] Manually creating customer_addresses table...');

    try {
        // 1. 创建表
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "customer_addresses" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "tenant_id" uuid NOT NULL,
                "customer_id" uuid NOT NULL,
                "label" varchar(50),
                "province" varchar(50),
                "city" varchar(50),
                "district" varchar(50),
                "community" varchar(100),
                "address" varchar(255) NOT NULL,
                "is_default" boolean DEFAULT false,
                "created_at" timestamp with time zone DEFAULT now(),
                "updated_at" timestamp with time zone DEFAULT now()
            );
        `);
        console.log('[DEBUG] Table created successfully');

        // 2. 创建索引
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS "idx_cust_addresses_customer" ON "customer_addresses" ("customer_id");
        `);
        console.log('[DEBUG] Index created successfully');

        // 3. 添加外键 (如果需要)
        // 注意：这里可能需要确认 tenants 和 customers 表是否已存在且 ID 类型匹配
        try {
            await db.execute(sql`
                ALTER TABLE "customer_addresses" 
                ADD CONSTRAINT "customer_addresses_tenant_id_tenants_id_fk" 
                FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            `);
            await db.execute(sql`
                ALTER TABLE "customer_addresses" 
                ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" 
                FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            `);
            console.log('[DEBUG] Foreign keys added successfully');
        } catch (fkError: any) {
            console.warn('[WARNING] Failed to add foreign keys (they might already exist):', fkError.message);
        }

    } catch (error: any) {
        console.error('[ERROR] Failed to manually create table:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
