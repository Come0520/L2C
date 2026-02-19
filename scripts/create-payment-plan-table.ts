import 'dotenv/config';
import postgres from 'postgres';

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL environment variable is required');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);

    try {
        console.log('Creating table payment_plan_nodes...');

        await sql`
            CREATE TABLE IF NOT EXISTS "payment_plan_nodes" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "tenant_id" uuid NOT NULL,
                "ar_statement_id" uuid NOT NULL,
                "node_index" integer NOT NULL,
                "node_name" varchar(100) NOT NULL,
                "percentage" numeric(5, 2) NOT NULL,
                "amount" numeric(12, 2) NOT NULL,
                "due_date" date,
                "status" varchar(20) DEFAULT 'PENDING' NOT NULL,
                "created_at" timestamp with time zone DEFAULT now(),
                "updated_at" timestamp with time zone DEFAULT now()
            );
        `;

        console.log('Creating indexes...');
        await sql`CREATE INDEX IF NOT EXISTS "idx_payment_plan_nodes_tenant" ON "payment_plan_nodes" ("tenant_id");`;
        await sql`CREATE INDEX IF NOT EXISTS "idx_payment_plan_nodes_ar" ON "payment_plan_nodes" ("ar_statement_id");`;

        console.log('Table and indexes created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
