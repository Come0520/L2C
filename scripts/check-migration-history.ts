
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }
    const client = postgres(process.env.DATABASE_URL);

    try {
        const result = await client`
            SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC;
        `;
        console.log('Migration History:', result);
    } catch (e) {
        console.error('Error querying migrations:', e);
        // Check if schema exists
        const schema = await client`
            SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'drizzle';
        `;
        console.log('Drizzle Schema Exists:', schema.length > 0);
    }

    process.exit(0);
}

main();
