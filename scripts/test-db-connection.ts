import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Testing DB connection...');
    try {
        const result = await db.execute(sql`SELECT 1`);
        console.log('Connection successful:', result);
    } catch (error) {
        console.error('Connection failed:', error);
    }
    process.exit(0);
}

main();
