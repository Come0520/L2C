
import { db } from '../src/shared/api/db';
import { leads } from '../src/shared/api/schema';
import { getLeadDetail } from '../src/features/leads/actions/queries';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    console.log('Starting verification...');

    // 1. Create a dummy lead directly in DB to ensure it exists
    // We need minimal required fields. Based on schema, assume id, name, tenantId?
    // Let's check schema first or try to insert minimal.
    // Actually, I'll try to list recent leads first to see if the one from test exists.

    const recentLeads = await db.query.leads.findMany({
        limit: 5,
        orderBy: (leads, { desc }) => [desc(leads.createdAt)],
    });

    console.log('Recent 5 leads in DB:', recentLeads.map(l => ({ id: l.id, name: l.name, tenantId: l.tenantId })));

    if (recentLeads.length > 0) {
        const testId = recentLeads[0].id;
        console.log(`Testing getLeadDetail with ID: ${testId}`);
        try {
            const detail = await getLeadDetail(testId);
            console.log('getLeadDetail result:', detail ? 'FOUND' : 'NULL');
            if (detail) {
                console.log('Detail ID:', detail.id);
            }
        } catch (e) {
            console.error('getLeadDetail threw error:', e);
        }
    } else {
        console.log('No leads found in DB to test.');
    }

    // 2. Try to insert one if needed (skipped for now, relying on existing data)
}

main().catch(console.error).finally(() => process.exit(0));
