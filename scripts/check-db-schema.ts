
import { config } from 'dotenv';
config({ path: '.env.local' });
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'dummy_secret_for_scripts';

async function checkSchema() {
    const { db } = await import('../src/shared/api/db');
    const { sql } = await import('drizzle-orm');

    console.log('--- Checking LEADS table columns ---');
    const leadsCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'leads'
    `);
    console.log(leadsCols.map(c => `${c.column_name}: ${c.udt_name}`).join('\n'));

    console.log('--- Checking intention_level ENUM ---');
    try {
        const intentionLevel = await db.execute(sql`SELECT enum_range(NULL::intention_level)`);
        console.log(JSON.stringify(intentionLevel, null, 2));
    } catch (e) { console.log('intention_level enum check failed:', e); }

    console.log('--- Checking LEAD_ACTIVITIES table columns ---');
    const leadActivitiesCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'lead_activities'
    `);
    console.log(JSON.stringify(leadActivitiesCols, null, 2));

    console.log('--- Checking QUOTES table columns ---');
    const quotesCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'quotes'
    `);
    console.log(JSON.stringify(quotesCols, null, 2));

    console.log('--- Checking lead_status ENUM ---');
    const leadStatus = await db.execute(sql`SELECT enum_range(NULL::lead_status)`);
    console.log(JSON.stringify(leadStatus, null, 2));

    console.log('--- Attempting Manual LEAD Insertion ---');
    try {
        const tenant = await db.query.tenants.findFirst();
        const user = await db.query.users.findFirst();
        if (!tenant || !user) throw new Error('No tenant or user found');

        const tenantId = tenant.id;
        const userId = user.id;
        const leadId = crypto.randomUUID();

        // Minimal insert using Drizzle ORM
        const { leads } = await import('../src/shared/api/schema');
        const [insertedLead] = await db.insert(leads).values({
            id: leadId,
            tenantId: tenantId,
            leadNo: `TEST-L-${crypto.randomUUID().slice(0, 8)}`,
            customerName: 'Test User ORM',
            customerPhone: '13800000099',
            status: 'PENDING_ASSIGNMENT',
            intentionLevel: 'MEDIUM',
            estimatedAmount: '10000',
            sourceChannelId: null,
            createdBy: userId,
        }).returning();

        console.log('✅ Manual Lead Insert Success (ORM):', insertedLead.id);
    } catch (e) {
        console.error('❌ Manual Lead Insert Failed (ORM):', e);
    }

    console.log('--- Checking TRIGGERS on LEADS table ---');
    const leadTriggers = await db.execute(sql`
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'leads'
    `);
    console.log(JSON.stringify(leadTriggers, null, 2));

    console.log('--- Checking TRIGGERS on QUOTES table ---');
    const quoteTriggers = await db.execute(sql`
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'quotes'
    `);
    console.log(JSON.stringify(quoteTriggers, null, 2));

    console.log('--- Checking JOB (quote_items) TRIGGERS ---');
    const quoteItemsTriggers = await db.execute(sql`
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'quote_items'
    `);
    console.log(JSON.stringify(quoteItemsTriggers, null, 2));

    console.log('--- Checking QUOTE_ITEMS table columns ---');
    const quoteItemsCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'quote_items'
    `);
    console.log(JSON.stringify(quoteItemsCols, null, 2));




    console.log('--- Attempting Manual QUOTE Insertion ---');
    try {
        const { quotes, quoteItems } = await import('../src/shared/api/schema');
        const quoteId = crypto.randomUUID();

        // Use the inserted lead if available, or fetch one
        const lead = await db.query.leads.findFirst();
        const customer = await db.query.customers.findFirst();
        const tenant = await db.query.tenants.findFirst();
        const user = await db.query.users.findFirst();

        if (!lead || !customer || !tenant || !user) throw new Error('Missing prerequisites');

        const [insertedQuote] = await db.insert(quotes).values({
            id: quoteId,
            tenantId: tenant.id,
            quoteNo: `TEST-Q-${crypto.randomUUID().slice(0, 8)}`,
            title: 'Manual Quote',
            isActive: true, // properties mismatch fix: isLatest -> isActive
            leadId: lead.id,
            customerId: customer.id,
            createdBy: user.id,
            status: 'DRAFT' // Testing DRAFT which is an enum
        }).returning();
        console.log('✅ Manual Quote Insert Success:', insertedQuote.id);

        console.log('--- Attempting Manual QUOTE ITEM Insertion ---');
        await db.insert(quoteItems).values({
            tenantId: tenant.id,
            quoteId: quoteId,
            productName: 'Manual Product',
            category: 'CURTAIN_FABRIC', // Varchar
            unit: 'METER', // Varchar
            unitPrice: '100',
            quantity: '10',
            subtotal: '1000',
            sortOrder: 0
        });
        console.log('✅ Manual Quote Item Insert Success');
    } catch (e) {
        console.error('❌ Manual Quote/Item Insert Failed:', e);
    }

    console.log('--- Checking INVENTORY_LOGS table columns ---');
    const inventoryLogsCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'inventory_logs'
    `);
    console.log(JSON.stringify(inventoryLogsCols, null, 2));

    console.log('--- Checking inventory_log_type ENUM ---');
    const invLogTypeEnum = await db.execute(sql`
        SELECT enum_range(NULL::inventory_log_type)
    `);
    console.log(JSON.stringify(invLogTypeEnum, null, 2));

    console.log('--- Checking MARKET_CHANNELS table columns ---');
    const marketChannelsCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'market_channels'
    `);
    console.log(JSON.stringify(marketChannelsCols, null, 2));

    console.log('--- Checking QUOTE_PLANS table columns ---');
    const quotePlansCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'quote_plans'
    `);
    console.log(JSON.stringify(quotePlansCols, null, 2));

    console.log('--- Checking QUOTE_PLANS triggers ---');
    const quotePlansTriggers = await db.execute(sql`
        SELECT trigger_name, event_manipulation, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'quote_plans'
    `);
    console.log(JSON.stringify(quotePlansTriggers, null, 2));


    console.log('--- Checking PRODUCTS table columns ---');
    const productsCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'products'
    `);
    console.log(JSON.stringify(productsCols, null, 2));

    console.log('--- Checking product_category ENUM ---');
    const prodCatEnum = await db.execute(sql`
        SELECT enum_range(NULL::product_category)
    `);
    console.log(JSON.stringify(prodCatEnum, null, 2));

    console.log('--- Checking activity_type ENUM (lead_activities) ---');
    // Note: The column is likely 'activity_type' or similar. 
    // And the ENUM type might be 'activity_type' or 'lead_activity_type'.
    // Let's check Columns of LEAD_ACTIVITIES first.
    console.log('--- Checking LEAD_ACTIVITIES table columns ---');
    const leadActCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'lead_activities'
    `);
    console.log(JSON.stringify(leadActCols, null, 2));

    // Try detecting enum name from UDT
    // If it's 'activity_type', check it.
    try {
        const actTypeEnum = await db.execute(sql`
            SELECT enum_range(NULL::lead_activity_type)
        `);
        console.log('--- Checking lead_activity_type ENUM ---');
        console.log(JSON.stringify(actTypeEnum, null, 2));
    } catch (e) {
        console.log('Could not check lead_activity_type enum directly (maybe name differs)');
    }

    console.log('--- Checking CUSTOMERS table columns ---');
    const customersCols = await db.execute(sql`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'customers'
    `);
    console.log(JSON.stringify(customersCols, null, 2));

    process.exit(0);
}

checkSchema().catch(console.error);
