import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

const sql = postgres(process.env.DATABASE_URL);

async function main() {
    console.log('Initializing Showroom Tables...');

    try {
        // 1. Create Enums
        await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."showroom_item_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
        console.log('Enum showroom_item_status checked/created.');

        await sql`
      DO $$ BEGIN
        CREATE TYPE "public"."showroom_item_type" AS ENUM('PRODUCT', 'CASE', 'KNOWLEDGE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
        console.log('Enum showroom_item_type checked/created.');

        // 2. Create Tables
        await sql`
      CREATE TABLE IF NOT EXISTS "showroom_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "type" "showroom_item_type" NOT NULL,
        "product_id" uuid,
        "title" varchar(200) NOT NULL,
        "content" text,
        "images" jsonb DEFAULT '[]'::jsonb,
        "tags" jsonb DEFAULT '[]'::jsonb,
        "score" integer DEFAULT 0,
        "status" "showroom_item_status" DEFAULT 'DRAFT' NOT NULL,
        "views" integer DEFAULT 0,
        "shares" integer DEFAULT 0,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );
    `;
        console.log('Table showroom_items checked/created.');

        await sql`
      CREATE TABLE IF NOT EXISTS "showroom_shares" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "sales_id" uuid NOT NULL,
        "customer_id" uuid,
        "items_snapshot" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "is_active" integer DEFAULT 1,
        "expires_at" timestamp with time zone NOT NULL,
        "views" integer DEFAULT 0,
        "last_viewed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now()
      );
    `;
        console.log('Table showroom_shares checked/created.');

        // 3. Add Constraints (Check if exists first to avoid error, or catch error)
        // Helper to add constraint safely
        const addConstraint = async (tableName: string, constraintName: string, query: string) => {
            try {
                await sql.unsafe(query);
                console.log(`Constraint ${constraintName} added to ${tableName}.`);
            } catch (e: any) {
                if (e.code === '42710') { // duplicate_object
                    console.log(`Constraint ${constraintName} already exists.`);
                } else {
                    console.error(`Error adding constraint ${constraintName}:`, e.message);
                }
            }
        };

        await addConstraint('showroom_items', 'showroom_items_tenant_id_tenants_id_fk',
            `ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;`);

        await addConstraint('showroom_items', 'showroom_items_product_id_products_id_fk',
            `ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;`);

        await addConstraint('showroom_items', 'showroom_items_created_by_users_id_fk',
            `ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;`);

        await addConstraint('showroom_items', 'showroom_items_updated_by_users_id_fk',
            `ALTER TABLE "showroom_items" ADD CONSTRAINT "showroom_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;`);

        await addConstraint('showroom_shares', 'showroom_shares_tenant_id_tenants_id_fk',
            `ALTER TABLE "showroom_shares" ADD CONSTRAINT "showroom_shares_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;`);

        await addConstraint('showroom_shares', 'showroom_shares_sales_id_users_id_fk',
            `ALTER TABLE "showroom_shares" ADD CONSTRAINT "showroom_shares_sales_id_users_id_fk" FOREIGN KEY ("sales_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;`);

        await addConstraint('showroom_shares', 'showroom_shares_customer_id_customers_id_fk',
            `ALTER TABLE "showroom_shares" ADD CONSTRAINT "showroom_shares_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;`);

        // 4. Create Indexes
        const createIndex = async (indexName: string, query: string) => {
            try {
                await sql.unsafe(query);
                console.log(`Index ${indexName} created.`);
            } catch (e: any) {
                if (e.code === '42P07') { // duplicate_table (relation already exists)
                    console.log(`Index ${indexName} already exists.`);
                } else {
                    console.error(`Error creating index ${indexName}:`, e.message);
                }
            }
        }

        await createIndex('idx_showroom_items_tenant', `CREATE INDEX "idx_showroom_items_tenant" ON "showroom_items" USING btree ("tenant_id");`);
        await createIndex('idx_showroom_items_product', `CREATE INDEX "idx_showroom_items_product" ON "showroom_items" USING btree ("product_id");`);
        await createIndex('idx_showroom_items_type', `CREATE INDEX "idx_showroom_items_type" ON "showroom_items" USING btree ("type");`);

        await createIndex('idx_showroom_shares_tenant', `CREATE INDEX "idx_showroom_shares_tenant" ON "showroom_shares" USING btree ("tenant_id");`);
        await createIndex('idx_showroom_shares_sales', `CREATE INDEX "idx_showroom_shares_sales" ON "showroom_shares" USING btree ("sales_id");`);
        await createIndex('idx_showroom_shares_customer', `CREATE INDEX "idx_showroom_shares_customer" ON "showroom_shares" USING btree ("customer_id");`);

        console.log('Showroom initialization complete.');
    } catch (err) {
        console.error('Initialization failed:', err);
    } finally {
        await sql.end();
    }
}

main();
