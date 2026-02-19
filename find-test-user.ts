
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { db } from './src/shared/api/db';
import { users } from './src/shared/api/schema';
import { eq, and } from 'drizzle-orm';

async function findUsers() {
    try {
        const workerId = '00aa5bea-a8d9-41e6-a8e3-7ae72d998b64';
        const worker = await db.query.users.findFirst({
            where: eq(users.id, workerId)
        });
        console.log('Worker found:', JSON.stringify(worker, null, 2));

        const anyWorker = await db.query.users.findFirst({
            where: eq(users.role, 'WORKER')
        });
        console.log('Random worker:', JSON.stringify(anyWorker, null, 2));
    } catch (err) {
        console.error('Database query failed:', err);
    }
    process.exit(0);
}

findUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
