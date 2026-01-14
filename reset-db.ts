import 'dotenv/config';
import postgres from 'postgres';

async function reset() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }

    const sql = postgres(databaseUrl);

    try {
        console.log('🗑️ Dropping public schema...');
        await sql`DROP SCHEMA public CASCADE`;
        console.log('🏗️ Recreating public schema...');
        await sql`CREATE SCHEMA public`;
        console.log('✅ Database reset successful');
    } catch (error) {
        console.error('❌ Database reset failed:', error);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

reset();
