
import { db } from './src/shared/api/db';
import { users, leads } from './src/shared/api/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    try {
        const tenantId = 'e772e5f7-95fe-4b27-9949-fc69de11d647';

        console.log('Testing drizzle count...');
        const count = await db.$count(leads, eq(leads.tenantId, tenantId));
        console.log('Count Success:', count);

        console.log('Testing drizzle findMany...');
        const rows = await db.query.leads.findMany({
            where: eq(leads.tenantId, tenantId),
            with: {
                assignedSales: true,
                sourceChannel: true,
                sourceSub: true,
                customer: true,
            },
            limit: 10,
        });
        console.log('Success:', rows.length);
    } catch (error) {
        console.error('Database Error Occurred:');
        console.error(error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            // @ts-ignore
            console.error('Postgres Error Name:', error.name);
            // @ts-ignore
            if (error.cause) {
                // @ts-ignore
                console.error('Missing Column Info:', error.cause.message);
                // @ts-ignore
                console.error('Details:', error.cause.detail);
            }
        }
    }
    process.exit(0);
}

main();
