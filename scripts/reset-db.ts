
import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('🗑️ Dropping public schema...');
        await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
        await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE;`);
        await db.execute(sql`CREATE SCHEMA public;`);
        await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);
        await db.execute(sql`COMMENT ON SCHEMA public IS 'standard public schema';`);
        console.log('✅ Public schema reset successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to reset DB:', error);
        process.exit(1);
    }
}

main();
