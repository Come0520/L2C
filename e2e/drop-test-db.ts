import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

import { sql } from 'drizzle-orm';
import { db } from '../src/shared/api/db';

async function main() {
    console.log('Dropping public schema...');
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    console.log('Creating public schema...');
    await db.execute(sql`CREATE SCHEMA public;`);
    console.log('Done.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
