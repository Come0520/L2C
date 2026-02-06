import 'dotenv/config';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';

async function truncateAll() {
    console.log('Truncating all tables for clean re-seed...');

    await db.execute(sql`
        TRUNCATE channels RESTART IDENTITY CASCADE
    `);

    console.log('✅ All tables truncated');
    process.exit(0);
}

truncateAll().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
