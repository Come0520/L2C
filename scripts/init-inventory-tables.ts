

import { config } from 'dotenv';
import path from 'path';
// Try loading .env.local first, then .env
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import { sql } from 'drizzle-orm';

async function main() {
  // Dynamic import to ensure env vars are loaded before db connection is initialized
  const { db } = await import('../src/shared/api/db');

  console.log('Initializing Inventory Tables...');

  try {
    // 1. Create Enum Type
    console.log('Creating Enum: inventory_log_type...');
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "inventory_log_type" AS ENUM ('IN', 'OUT', 'ADJUST', 'TRANSFER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create Warehouses Table
    console.log('Creating Table: warehouses...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "warehouses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" text NOT NULL,
        "name" text NOT NULL,
        "address" text,
        "manager_id" uuid,
        "is_default" numeric DEFAULT '0',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);

    // 3. Create Inventory Table
    console.log('Creating Table: inventory...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "inventory" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" text NOT NULL,
        "warehouse_id" uuid NOT NULL REFERENCES "warehouses"("id"),
        "product_id" uuid NOT NULL REFERENCES "products"("id"),
        "quantity" integer NOT NULL DEFAULT 0,
        "min_stock" integer DEFAULT 0,
        "location" text,
        "updated_at" timestamp DEFAULT now()
      );
    `);

    // 4. Create Inventory Logs Table
    console.log('Creating Table: inventory_logs...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "inventory_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" text NOT NULL,
        "warehouse_id" uuid NOT NULL REFERENCES "warehouses"("id"),
        "product_id" uuid NOT NULL REFERENCES "products"("id"),
        "type" "inventory_log_type" NOT NULL,
        "quantity" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "reason" text,
        "reference_type" text,
        "reference_id" uuid,
        "operator_id" uuid REFERENCES "users"("id"),
        "description" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log('✅ Custom DB Init Completed Successfully.');
  } catch (err) {
    console.error('❌ DB Init Failed:', err);
    process.exit(1);
  }
}

main();
