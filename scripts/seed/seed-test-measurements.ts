import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';

type MeasureStatus = 'PENDING_APPROVAL' | 'REJECTED' | 'PENDING' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED';

type MeasureTaskInput = {
    tenantId: string;
    measureNo: string;
    leadId: string;
    customerId: string;
    salesId: string;
    createdBy: string;
    round: number;
    variant: string;
    isActive: boolean;
    status?: MeasureStatus;
    dispatcherId?: string;
    assignedWorkerId?: string;
    scheduledAt?: Date;
    salesBrief?: Record<string, unknown>;
    remark?: string;
    resultData?: Record<string, unknown>;
    images?: string[];
    completedAt?: Date;
};

type ScenarioSetup = (task: MeasureTaskInput) => MeasureTaskInput;

// Helpers
function generateDocNo(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

function randomDate(daysAgo: number): Date {
    const now = new Date();
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function randomFutureDate(daysAhead: number): Date {
    const now = new Date();
    return new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
}

async function main() {
    console.log('🌱 开始为 [TEST001] 播种测量任务数据...\n');

    // 1. Get Tenant TEST001
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'TEST001')
    });
    if (!tenant) {
        console.error('❌ Error: Tenant TEST001 not found.');
        process.exit(1);
    }

    // 2. Get Admin User (The only user in TEST001 usually)
    const adminUser = await db.query.users.findFirst({
        where: and(
            eq(schema.users.tenantId, tenant.id), // Ensure user belongs to this tenant
            eq(schema.users.phone, '13800000000')
        )
    });

    if (!adminUser) {
        console.error('❌ Error: Test Admin user (13800000000) not found.');
        process.exit(1);
    }
    console.log(`👤 Using User: ${adminUser.name}`);

    // 3. Get Leads
    const leads = await db.query.leads.findMany({
        where: eq(schema.leads.tenantId, tenant.id),
        limit: 20,
        orderBy: [desc(schema.leads.createdAt)]
    });

    if (leads.length === 0) {
        console.error('❌ Error: No leads found in TEST001.');
        process.exit(1);
    }
    console.log(`found ${leads.length} leads.`);

    // 4. Define Scenarios (Statuses)
    const scenarios: Array<{
        status: MeasureStatus;
        desc: string;
        setup: ScenarioSetup;
    }> = [
        {
            status: 'PENDING',
            desc: '待分配',
            setup: (task) => ({ ...task, status: 'PENDING' })
        },
        {
            status: 'DISPATCHING',
            desc: '分配中',
            setup: (task) => ({ ...task, status: 'DISPATCHING', dispatcherId: adminUser.id })
        },
        {
            status: 'PENDING_VISIT',
            desc: '待上门',
            setup: (task) => ({
                ...task,
                status: 'PENDING_VISIT',
                dispatcherId: adminUser.id,
                assignedWorkerId: adminUser.id,
                scheduledAt: randomFutureDate(2)
            })
        },
        {
            status: 'PENDING_CONFIRM',
            desc: '待确认',
            setup: (task) => ({
                ...task,
                status: 'PENDING_CONFIRM',
                dispatcherId: adminUser.id,
                assignedWorkerId: adminUser.id,
                scheduledAt: randomDate(1),
                resultData: { note: '测试数据-已测量' },
                images: []
            })
        },
        {
            status: 'COMPLETED',
            desc: '已完成',
            setup: (task) => ({
                ...task,
                status: 'COMPLETED',
                dispatcherId: adminUser.id,
                assignedWorkerId: adminUser.id,
                completedAt: randomDate(0),
                resultData: { rooms: [{ name: '测试房间', width: 3000, height: 2800 }] }
            })
        }
    ];

    // 5. Generate
    console.log('\n📏 Generating Measurement Tasks for TEST001...');

    for (const [index, scenario] of scenarios.entries()) {
        const lead = leads[index % leads.length]; // Cycle through leads if fewer than scenarios

        let customerId = lead.customerId;
        if (!customerId) {
            // Fallback: try to find a customer in this tenant
            const customer = await db.query.customers.findFirst({
                where: eq(schema.customers.tenantId, tenant.id)
            });
            if (!customer) {
                console.warn(`Skipping scenario ${scenario.status} because no customer found for lead ${lead.leadNo}`);
                continue;
            }
            customerId = customer.id;
        }

        const taskData = scenario.setup({
            tenantId: tenant.id,
            measureNo: generateDocNo('M-TEST-'),
            leadId: lead.id,
            customerId: customerId,
            salesId: adminUser.id,
            createdBy: adminUser.id,
            round: 1,
            variant: 'A',
            isActive: true,
        });

        await db.insert(schema.measureTasks).values(taskData);
        console.log(`   - [${scenario.status}] ${scenario.desc} (Lead: ${lead.leadNo})`);
    }

    console.log('\n✅ TEST001 Measurement Tasks Seeding Completed!');
    process.exit(0);
}

main().catch(console.error);
