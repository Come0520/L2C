
import 'dotenv/config';
import { db } from '../src/shared/api/db';
import { roles } from '../src/shared/api/schema';

async function main() {
    try {
        console.log('Querying roles...');
        const allRoles = await db.select().from(roles);
        console.log('Roles found:', allRoles.length);
        console.log(JSON.stringify(allRoles, null, 2));
    } catch (error) {
        console.error('Error querying roles:', error);
    } finally {
        process.exit(0);
    }
}

main();
