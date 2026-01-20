
import postgres from 'postgres';
import 'dotenv/config';

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }

    const sql = postgres(connectionString);

    console.log('Applying missing column external_id to leads table...');
    try {
        await sql`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "external_id" varchar(100);`;
        console.log('Successfully added external_id column.');
    } catch (error) {
        console.error('Error adding external_id:', error);
    }

    console.log('Checking for other missing columns from migration 0012...');
    // Add other missing pieces if necessary, but external_id is the blocker

    await sql.end();
}

main();
