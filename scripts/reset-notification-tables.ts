import 'dotenv/config';
import { db } from '@/shared/api/db'; // tsx should handle alias if tsconfig is picked up, otherwise relative
import { sql } from 'drizzle-orm';

// Fallback if alias doesn't work in this context (depends on tsconfig paths setup with tsx)
// Actually tsx might not respect paths without tsconfig-paths register.
// Let's use relative path to be safe if it fails.

async function reset() {
    console.log('Dropping notification tables...');
    try {
        await db.execute(sql`DROP TABLE IF EXISTS "notification_preferences" CASCADE`);
        await db.execute(sql`DROP TABLE IF EXISTS "notifications" CASCADE`);
        await db.execute(sql`DROP TYPE IF EXISTS "notification_channel" CASCADE`);
        await db.execute(sql`DROP TYPE IF EXISTS "notification_type" CASCADE`);
        console.log('Tables and types dropped.');
    } catch (err) {
        console.error('Error dropping tables:', err);
    }
    process.exit(0);
}

reset();
