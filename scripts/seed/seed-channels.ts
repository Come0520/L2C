import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/shared/api/schema';
import dotenv from 'dotenv';


dotenv.config({ path: '.env.local' });

// Standard Channel Hierarchy
const CHANNEL_DATA = [
    {
        name: '线上渠道',
        code: 'ONLINE',
        channels: [
            { name: '美团点评', code: 'MEITUAN' },
            { name: '抖音/Tiktok', code: 'DOUYIN' },
            { name: '小红书', code: 'XIAOHONGSHU' },
            { name: '微信公众号', code: 'WECHAT_OFFICIAL' },
            { name: '天猫/淘宝', code: 'TMALL' },
            { name: '京东', code: 'JD' },
        ]
    },
    {
        name: '线下门店',
        code: 'OFFLINE',
        channels: [
            { name: '自然进店', code: 'WALK_IN' },
            { name: '地推活动', code: 'EVENT' },
            { name: '电话咨询', code: 'PHONE_CALL' },
            { name: '样板间参观', code: 'SHOWROOM' },
        ]
    },
    {
        name: '转介绍',
        code: 'REFERRAL',
        channels: [
            { name: '老客户转介绍', code: 'CUSTOMER_REFERRAL' },
            { name: '员工转介绍', code: 'EMPLOYEE_REFERRAL' },
            { name: '异业带单', code: 'PARTNER' },
            { name: '设计师推荐', code: 'DESIGNER' },
        ]
    }
];

async function seedChannels() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined in environment variables');
        process.exit(1);
    }

    console.log('🌱 Starting Channel Seeding...');

    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { schema });

    try {
        // Get the first tenant (Assuming single tenant for dev)
        const tenant = await db.query.tenants.findFirst();
        if (!tenant) {
            console.error('❌ No tenant found. Please run seed-test-user first.');
            process.exit(1);
        }
        const tenantId = tenant.id;
        console.log(`Using Tenant ID: ${tenantId}`);

        for (const catData of CHANNEL_DATA) {
            // Upsert Category
            let categoryId: string;
            const existingCat = await db.query.marketChannelCategories.findFirst({
                where: (t, { eq, and }) => and(eq(t.code, catData.code), eq(t.tenantId, tenantId))
            });

            if (existingCat) {
                console.log(`- Category exists: ${catData.name}`);
                categoryId = existingCat.id;
            } else {
                const [newCat] = await db.insert(schema.marketChannelCategories).values({
                    tenantId,
                    name: catData.name,
                    code: catData.code
                }).returning();
                console.log(`+ Created Category: ${catData.name}`);
                categoryId = newCat.id;
            }

            // Upsert Channels
            for (const chData of catData.channels) {
                const existingCh = await db.query.marketChannels.findFirst({
                    where: (t, { eq, and }) => and(
                        eq(t.code, chData.code),
                        eq(t.categoryId, categoryId),
                        eq(t.tenantId, tenantId)
                    )
                });

                if (!existingCh) {
                    await db.insert(schema.marketChannels).values({
                        tenantId,
                        categoryId,
                        name: chData.name,
                        code: chData.code
                    });
                    console.log(`  + Created Channel: ${chData.name}`);
                }
            }
        }

        console.log('✅ Channel Seeding Completed!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await client.end();
    }
    process.exit(0);
}

seedChannels();
