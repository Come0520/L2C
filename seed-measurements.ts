import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, desc } from 'drizzle-orm';

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
    createdAt: Date;
    status?: MeasureStatus;
    dispatcherId?: string;
    assignedWorkerId?: string;
    scheduledAt?: Date;
    salesBrief?: Record<string, unknown>;
    remark?: string;
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
    console.log('🌱 开始播种测量任务数据 (包含各种状态)...\n');

    // 1. Get Tenant
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'DEMO')
    });
    if (!tenant) {
        console.error('❌ Error: Demo Tenant not found. Please run seed-full.ts first.');
        process.exit(1);
    }

    // 2. Get Users (Roles)
    const salesUser = await db.query.users.findFirst({ where: (u, { like }) => like(u.name, '%销售%') }) || (await db.query.users.findFirst());
    const dispatcherUser = await db.query.users.findFirst({ where: (u, { like }) => like(u.role, 'DISPATCHER') }) || salesUser;
    const measurerUsers = await db.query.users.findMany({ where: (u, { like }) => like(u.role, 'MEASURER') });

    if (!salesUser) {
        console.error('❌ Error: No users found.');
        process.exit(1);
    }
    const measurer = measurerUsers[0] || salesUser;

    console.log(`👤 Sales: ${salesUser.name}, Dispatcher: ${dispatcherUser?.name}, Measurer: ${measurer.name}`);

    // 3. Get Leads to attach tasks to
    // We need leads that are at least existing.
    const leads = await db.query.leads.findMany({
        where: eq(schema.leads.tenantId, tenant.id),
        limit: 20,
        orderBy: [desc(schema.leads.createdAt)]
    });

    if (leads.length === 0) {
        console.error('❌ Error: No leads found. Please run seed-full.ts first.');
        process.exit(1);
    }
    console.log(`found ${leads.length} leads.`);

    // 4. Define Scenarios
    const scenarios: Array<{
        status: string;
        desc: string;
        setup: ScenarioSetup;
    }> = [
        {
            status: 'PENDING',
            desc: '待分配: 刚发起的测量任务',
            setup: (task) => ({
                ...task,
                status: 'PENDING',
            })
        },
        {
            status: 'DISPATCHING',
            desc: '分配中: 派单员正在处理',
            setup: (task) => ({
                ...task,
                status: 'DISPATCHING',
                dispatcherId: dispatcherUser?.id,
            })
        },
        {
            status: 'PENDING_VISIT',
            desc: '待上门: 已指派师傅, 等待上门',
            setup: (task) => ({
                ...task,
                status: 'PENDING_VISIT',
                dispatcherId: dispatcherUser?.id,
                assignedWorkerId: measurer.id,
                scheduledAt: randomFutureDate(2),
            })
        },
        {
            status: 'PENDING_CONFIRM',
            desc: '待确认: 师傅已提交数据, 等待确认',
            setup: (task) => ({
                ...task,
                status: 'PENDING_CONFIRM',
                dispatcherId: dispatcherUser?.id,
                assignedWorkerId: measurer.id,
                scheduledAt: randomDate(1),
                checkInAt: randomDate(1),
                checkInLocation: { lat: 30, lng: 120, address: '打卡地点' },
                resultData: { note: '已测量完成, 数据如下...' },
                images: ['https://placehold.co/600x400?text=Measure+Photo+1', 'https://placehold.co/600x400?text=Measure+Photo+2']
            })
        },
        {
            status: 'COMPLETED',
            desc: '已完成: 测量已确认归档',
            setup: (task) => ({
                ...task,
                status: 'COMPLETED',
                dispatcherId: dispatcherUser?.id,
                assignedWorkerId: measurer.id,
                scheduledAt: randomDate(5),
                checkInAt: randomDate(5),
                resultData: {
                    rooms: [
                        { name: '客厅', width: 3500, height: 2750 },
                        { name: '主卧', width: 2800, height: 2600 }
                    ]
                },
                completedAt: randomDate(4),
            })
        },
        {
            status: 'CANCELLED',
            desc: '已取消: 客户取消或不需要',
            setup: (task) => ({
                ...task,
                status: 'CANCELLED',
                remark: '客户暂时不做了',
            })
        }
    ];

    // 5. Generate Data
    console.log('\n📏 Generating Measurement Tasks...');

    for (const [index, scenario] of scenarios.entries()) {
        const lead = leads[index % leads.length];

        const baseTask = {
            tenantId: tenant.id,
            measureNo: generateDocNo('M'),
            leadId: lead.id,
            customerId: lead.customerId || lead.referrerCustomerId, // Fallback if customerId is null (shouldn't be for valid leads usually, but schema allows null? Schema says customerId is nullable in leads? No, line 353 "customerId" references customers.id. Wait, line 353 `customerId: uuid('customer_id').references(() => customers.id),` IS nullable. But measureTasks customerId is NOT NULL: line 728.)
            // If lead.customerId is null, we need to find a customer or use leads info to find one.
            // For now assume lead has customerId. If not, pick a random customer.
        };

        let customerId = lead.customerId;
        if (!customerId) {
            const customer = await db.query.customers.findFirst();
            customerId = customer?.id ?? null;
        }

        if (!customerId) {
            console.warn(`Skipping scenario ${scenario.status} because no customer found for lead ${lead.leadNo}`);
            continue;
        }

        const taskData = scenario.setup({
            ...baseTask,
            customerId: customerId,
            salesId: salesUser.id,
            createdBy: salesUser.id,
            round: 1,
            variant: 'A',
            isActive: true,
            createdAt: new Date(),
        });

        await db.insert(schema.measureTasks).values(taskData);
        console.log(`   - [${scenario.status}] ${scenario.desc} (Lead: ${lead.leadNo})`);
    }

    console.log('\n✅ Measurement Tasks Seeding Completed!');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
});

