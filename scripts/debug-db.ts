import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix: Load env vars BEFORE importing modules that use them
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { eq } from 'drizzle-orm';

async function main() {
    console.log('Testing DB Query...');

    // Check DB URL (masked)
    const dbUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL:', dbUrl ? dbUrl.replace(/:[^:@]+@/, ':***@') : 'undefined');

    // Dynamic import to ensure env vars are loaded
    const { db } = await import('../src/shared/api/db');
    const { users } = await import('../src/shared/api/schema');
    const { sql } = await import('drizzle-orm');

    try {
        console.log('Testing connection (select 1)...');
        await db.execute(sql`select 1`);
        console.log('Connection OK.');

        // Hotfix: manually add missing column if needed
        console.log('Attempting to apply hotfix schema...');
        try {
            await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin boolean DEFAULT false`);
            await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{}'::jsonb`);
            console.log('Hotfix applied successfully.');
        } catch (e: any) {
            console.log('Hotfix warning (might already exist):', e.message);
        }

        console.log('Executing query...');
        const query = db.query.users.findFirst({
            where: eq(users.wechatOpenId, 'test-openid'),
        });

        // Is there a way to get SQL from query builder in Drizzle Query API?
        // Query API doesn't easily expose .toSQL() like relational/builder syntax.
        // But we can try to execute it.

        const result = await query;
        console.log('Query result:', result);
        console.log('Success!');
    } catch (error: any) {
        console.log('Query Failed!');
        console.log('Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
