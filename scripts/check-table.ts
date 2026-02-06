
import { config } from 'dotenv';
config({ path: '.env.local' });
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'dummy_secret_for_scripts';
import { sql } from 'drizzle-orm';


async function checkTable() {
    const { db } = await import('../src/shared/api/db');

    const tableName = 'inventory_logs';
    console.log(`Checking columns for table: ${tableName}`);

    const result = await db.execute(sql`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = ${tableName}
    `);

    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}


checkTable().catch(console.error);
