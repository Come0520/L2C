import 'dotenv/config';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';

async function checkEnums() {
    console.log('Checking enum values in database...');

    const result = await db.execute(sql`
        SELECT t.typname, e.enumlabel
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname IN (
            'fabric_inventory_log_type', 
            'supplier_type', 
            'inventory_log_type',
            'lead_status',
            'customer_level',
            'product_category',
            'intention_level'
        )
        ORDER BY t.typname, e.enumlabel;
    `);

    console.log('Enum Values found:');
    result.forEach(row => {
        console.log(`${row.typname}: ${row.enumlabel}`);
    });

    process.exit(0);
}

checkEnums();
