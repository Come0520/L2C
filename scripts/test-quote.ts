
import { config } from 'dotenv';
config({ path: '.env.local' });
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'dummy_secret_for_scripts';
// import { db } from '../src/shared/api/db';
// import * as schema from '../src/shared/api/schema';
import { eq } from 'drizzle-orm';

async function testQuote() {
    console.log('Testing quote insertion...');
    const { db } = await import('../src/shared/api/db');
    const schema = await import('../src/shared/api/schema');

    // Find a tenant, customer, lead, user
    const tenant = await db.query.tenants.findFirst();
    const customer = await db.query.customers.findFirst();
    const lead = await db.query.leads.findFirst();
    const user = await db.query.users.findFirst();

    if (!tenant || !customer || !lead || !user) {
        console.error('Missing prerequisites');
        return;
    }

    console.log('Inserting quote with status DRAFT...');
    try {
        const [quote] = await db.insert(schema.quotes).values({
            tenantId: tenant.id,
            quoteNo: `TEST-Q-${Date.now()}`,
            title: 'Test Quote',
            isLatest: true,
            leadId: lead.id,
            customerId: customer.id,
            status: 'DRAFT',
            totalAmount: '100',
            discountAmount: '0',
            finalAmount: '100',
            createdBy: user.id,
            createdAt: new Date().toISOString(),
        }).returning();
        console.log('✅ Inserted quote:', quote.id);
    } catch (e) {
        console.error('❌ Failed to insert DRAFT quote:', e);
    }

    console.log('Inserting quote with status LOCKED...');
    try {
        const [quote2] = await db.insert(schema.quotes).values({
            tenantId: tenant.id,
            quoteNo: `TEST-Q-${Date.now()}-2`,
            title: 'Test Quote Locked',
            isLatest: true,
            leadId: lead.id,
            customerId: customer.id,
            status: 'LOCKED',
            totalAmount: '100',
            discountAmount: '0',
            finalAmount: '100',
            createdBy: user.id,
            createdAt: new Date().toISOString(),
        }).returning();
        console.log('✅ Inserted quote:', quote2.id);
    } catch (e) {
        console.error('❌ Failed to insert LOCKED quote:', e);
    }

    console.log('Checking quote_status enum directly in DB...');
    try {
        const { sql } = await import('drizzle-orm');
        const result = await db.execute(sql`SELECT enum_range(NULL::quote_status)`);
        console.log('Enum range:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Failed to check enum:', e);
    }

    process.exit(0);
}

testQuote().catch(console.error);
