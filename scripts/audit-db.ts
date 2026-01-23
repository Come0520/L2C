import { db } from './src/shared/api/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        const res = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log(JSON.stringify(res, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
