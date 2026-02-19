import 'dotenv/config';
import { db } from '@/shared/api/db';
import { channels } from '@/shared/api/schema/channels';
import { sql } from 'drizzle-orm';

async function checkDuplicates() {
    console.log('Checking for duplicate channel codes and names...');

    const duplicateCodes = await db.execute(sql`
        SELECT tenant_id, code, COUNT(*) as count, array_agg(name) as names
        FROM channels
        GROUP BY tenant_id, code
        HAVING COUNT(*) > 1
    `);

    const duplicateNames = await db.execute(sql`
        SELECT tenant_id, name, COUNT(*) as count, array_agg(code) as codes
        FROM channels
        GROUP BY tenant_id, name
        HAVING COUNT(*) > 1
    `);

    if (duplicateCodes.length > 0) {
        console.error('Found duplicate CODES:');
        console.table(duplicateCodes);
    } else {
        console.log('No duplicate codes found.');
    }

    if (duplicateNames.length > 0) {
        console.error('Found duplicate NAMES:');
        console.table(duplicateNames);
    } else {
        console.log('No duplicate names found.');
    }

    if (duplicateCodes.length > 0 || duplicateNames.length > 0) {
        console.error('Migration will fail until these duplicates are resolved.');
        process.exit(1);
    } else {
        console.log('Data is clean. Migration failure might be due to another reason.');
    }
}

checkDuplicates().catch(console.error);
