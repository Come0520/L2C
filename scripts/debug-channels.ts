
import 'dotenv/config';
import { db } from '@/shared/api/db';
import { sql } from 'drizzle-orm';

async function debugChannels() {
    console.log('Debugging Channels table...');

    const result = await db.execute(sql`
        SELECT id, name, code, level, "channel_type", "category", "cooperation_mode"
        FROM channels
        ORDER BY code
    `);

    console.table(result);
    process.exit(0);
}

debugChannels().catch(console.error);
