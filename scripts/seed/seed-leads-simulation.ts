import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, and, like } from 'drizzle-orm';

const NAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
const LOCATIONS = ['云山诗意', '保利花园', '万科城', '恒大绿洲', '中海国际', '华润置地', '碧桂园', '龙湖原著'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone() {
    return `13${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
}

async function main() {
    console.log('🌱 开始模拟线索数据 (待跟进/跟进中/已成交/已作废)...\n');

    // 1. Get All Tenants
    const tenants = await db.query.tenants.findMany();
    if (tenants.length === 0) {
        console.error('❌ Error: No tenants found.');
        return;
    }

    for (const tenant of tenants) {
        console.log(`\n🏢 Seeding for Tenant: ${tenant.name} (${tenant.code})`);

        // 2. Get Sales User for THIS tenant
        let salesUser = await db.query.users.findFirst({
            where: and(
                eq(schema.users.tenantId, tenant.id),
                like(schema.users.name, '%销售%')
            )
        });

        if (!salesUser) {
            // Fallback to any user in this tenant
            salesUser = await db.query.users.findFirst({
                where: eq(schema.users.tenantId, tenant.id)
            });
        }

        if (!salesUser) {
            console.log(`   ⚠️ No users found for tenant ${tenant.code}, skipping.`);
            continue;
        }
        console.log(`   👤 Using Sales User: ${salesUser.name}`);

        // 3. Get Channels for THIS tenant
        const channels = await db.query.marketChannels.findMany({
            where: eq(schema.marketChannels.tenantId, tenant.id)
        });

        if (channels.length === 0) {
            console.log(`   ⚠️ No channels found for tenant ${tenant.code}, using null channel.`);
        }

        // 4. Generate Leads
        const batchSize = 10; // Reduce batch size per tenant to avoid noise

        for (let i = 0; i < batchSize; i++) {
            const statusPool = ['PENDING_FOLLOWUP', 'FOLLOWING', 'WON', 'VOID'];
            const status = statusPool[i % statusPool.length];

            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const leadNo = `LD-${timestamp}${random}`;

            const name = `${getRandomElement(NAMES)}先生/女士`;
            const phone = generatePhone();
            const community = getRandomElement(LOCATIONS);

            const channel = channels.length > 0 ? getRandomElement(channels) : null;

            let lostReason = null;
            let customerId = null;

            if (status === 'VOID') {
                lostReason = getRandomElement(['价格太高', '竞品截单', '需求变更']);
            }

            if (status === 'WON') {
                // Create a customer for WON leads
                const custNo = `C-${timestamp}${random}`;
                const [cust] = await db.insert(schema.customers).values({
                    tenantId: tenant.id,
                    customerNo: custNo,
                    name: name,
                    phone: phone,
                    createdBy: salesUser.id,
                    assignedSalesId: salesUser.id,
                }).returning({ id: schema.customers.id });
                customerId = cust.id;
            }

            await db.insert(schema.leads).values({
                tenantId: tenant.id,
                leadNo: leadNo,
                customerName: name,
                customerPhone: phone,
                sourceCategoryId: channel?.categoryId,
                sourceSubId: channel?.id,
                sourceDetail: '模拟数据生成',
                status: status as typeof schema.leadStatusEnum.enumValues[number],
                intentionLevel: getRandomElement(['HIGH', 'MEDIUM', 'LOW']) as typeof schema.intentionLevelEnum.enumValues[number],
                assignedSalesId: salesUser.id,
                assignedAt: new Date(),
                community: community,
                houseType: getRandomElement(['三室两厅', '四室两厅', '大平层', '别墅']),
                estimatedAmount: String(Math.floor(Math.random() * 50000) + 10000),
                lostReason,
                customerId,
                wonAt: status === 'WON' ? new Date() : null,
                createdBy: salesUser.id,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)), // Random time in last 10 days
                updatedAt: new Date(),
            });

            console.log(`   - Created Lead: ${name} [${status}]`);
        }
    }

    console.log('\n✅ Leads simulation completed!');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});