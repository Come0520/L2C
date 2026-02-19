
import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🚀 Starting audit fixes...');

    try {
        // 1. Fix trailing spaces in Leads
        console.log('🔧 Fixing trailing spaces in lead_no...');
        const leadsResult = await db.execute(sql`UPDATE leads SET lead_no = TRIM(lead_no) WHERE lead_no LIKE '% '`);
        console.log(`✅ Leads updated.`);

        // 2. Fix trailing spaces in Customers
        console.log('🔧 Fixing trailing spaces in customer_no...');
        const customersResult = await db.execute(sql`UPDATE customers SET customer_no = TRIM(customer_no) WHERE customer_no LIKE '% '`);
        console.log(`✅ Customers updated.`);

        // 3. Fix approval_nodes conditions type (for db:push error)
        console.log('🔧 Fixing approval_nodes.conditions type (json -> jsonb)...');
        try {
            await db.execute(sql`ALTER TABLE approval_nodes ALTER COLUMN conditions TYPE jsonb USING conditions::jsonb`);
            console.log('✅ Successfully altered approval_nodes.conditions type.');
        } catch (error: any) {
            console.log('⚠️  Notice altering approval_nodes (maybe already fixed or different issue):', error.message);
        }

        console.log('🎉 Audit fixes completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing fixes:', error);
        process.exit(1);
    }
}

main();
