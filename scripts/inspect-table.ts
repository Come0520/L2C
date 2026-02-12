
import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('[INFO] Listing all tables and specifically looking for "address"...');

    try {
        const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        console.log(`[DATA] Total Public Tables: ${tables.length}`);
        const matching = tables.filter((t: any) => t.table_name.includes('address'));
        console.log('[DATA] Matching tables:', matching);

        const exact = tables.find((t: any) => t.table_name === 'customer_addresses');
        if (exact) {
            console.log('[SUCCESS] Found customer_addresses table.');
            const columns = await db.execute(sql`
            SELECT column_name, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'customer_addresses'
        `);
            console.table(columns);
        } else {
            console.log('[ERROR] customer_addresses table NOT found among public tables.');
        }
    } catch (error) {
        console.error('[ERROR] Failed to fetch data:', error);
    } finally {
        process.exit(0);
    }
}

main();
