
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);

    const result = await client`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'drizzle')
        ORDER BY table_schema, table_name;
    `;

    console.log('Tables in DB:', result.map(r => `${r.table_schema}.${r.table_name}`));
    process.exit(0);
}

main();
