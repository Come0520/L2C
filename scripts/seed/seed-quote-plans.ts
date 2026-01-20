
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/shared/api/schema';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined in environment variables');
        process.exit(1);
    }

    console.log('🌱 Starting Quote Configuration Seeding...');

    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { schema });

    try {
        // 1. Get Tenant (Default)
        const tenant = await db.query.tenants.findFirst();
        if (!tenant) {
            console.error('❌ No tenant found. Please seed tenant first.');
            process.exit(1);
        }
        const tenantId = tenant.id;

        // 2. Seed System Dictionaries
        console.log('Creating System Dictionaries...');
        const dicts = [
            {
                category: 'QUOTE_CONFIG',
                key: 'DEFAULT_FOLD_RATIO_FABRIC',
                value: '2.0',
                label: '默认布帘褶皱倍率',
                description: '布艺窗帘计算用料时的默认褶皱倍数'
            },
            {
                category: 'QUOTE_CONFIG',
                key: 'DEFAULT_FOLD_RATIO_SHEER',
                value: '2.0',
                label: '默认纱帘褶皱倍率',
                description: '纱帘计算用料时的默认褶皱倍数'
            },
            {
                category: 'QUOTE_CONFIG',
                key: 'DEFAULT_INSTALLATION_FEE_PER_METER',
                value: '50',
                label: '默认单窗安装费',
                description: '快速报价时每个窗户的默认安装费用'
            }
        ];

        for (const d of dicts) {
            await db.insert(schema.sysDictionaries).values({
                tenantId,
                category: d.category,
                key: d.key,
                value: d.value,
                label: d.label,
                description: d.description
            }).onConflictDoNothing();
        }

        // 3. Seed Quote Plans & Templates
        // Define Plans
        const plansData = [
            { code: 'ECONOMIC', name: '经济实惠型', description: '性价比首选，适合出租房或临时居住，满足基本遮光需求。' },
            { code: 'COMFORT', name: '舒适居家型', description: '品质生活之选，面料更有质感，垂感更好。' },
            { code: 'LUXURY', name: '奢华智能型', description: '高端定制体验，包含智能电动轨道，顶级面料工艺。' },
        ] as const;

        const planIds: Record<string, string> = {};

        for (const p of plansData) {
            // Check if exists
            const existing = await db.query.quotePlans.findFirst({
                where: (t, { eq, and }) => and(eq(t.code, p.code), eq(t.tenantId, tenantId))
            });

            if (existing) {
                planIds[p.code] = existing.id;
            } else {
                const [plan] = await db.insert(schema.quotePlans).values({
                    tenantId,
                    code: p.code,
                    name: p.name,
                    description: p.description
                }).returning();
                planIds[p.code] = plan.id;
            }
        }

        // Define Templates
        // Define all unique products first
        const productsData = [
            // ECONOMIC
            { key: 'eco_fabric', name: '简约棉麻遮光布', category: 'CURTAIN_FABRIC', price: 45, width: 2.8, fold: 2.0 },
            { key: 'eco_sheer', name: '基础百搭白纱', category: 'CURTAIN_SHEER', price: 25, width: 2.8, fold: 2.0 },
            { key: 'eco_track', name: '铝合金静音轨道', category: 'CURTAIN_TRACK', price: 35 },

            // COMFORT
            { key: 'com_fabric', name: '高精密雪尼尔棉麻', category: 'CURTAIN_FABRIC', price: 85, width: 2.8, fold: 2.0 },
            { key: 'com_sheer', name: '天丝亚麻肌理纱', category: 'CURTAIN_SHEER', price: 45, width: 2.8, fold: 2.0 },
            { key: 'com_track', name: '加厚加重静音轨道', category: 'CURTAIN_TRACK', price: 58 },

            // LUXURY
            { key: 'lux_fabric', name: '进口高精密提花面料', category: 'CURTAIN_FABRIC', price: 168, width: 2.8, fold: 2.5 },
            { key: 'lux_sheer', name: '幻影透光金刚纱', category: 'CURTAIN_SHEER', price: 88, width: 2.8, fold: 2.5 },
            { key: 'lux_track', name: '智能电动梦幻帘轨道', category: 'MOTOR', price: 480 },
            { key: 'lux_valance', name: '配套精致幔头', category: 'CURTAIN_ACCESSORY', price: 120 },
        ] as const;

        const templateIds: Record<string, string> = {};

        for (const prod of productsData) {
            // Check if exists by name (simplified for seed)
            const existing = await db.query.productTemplates.findFirst({
                where: (t, { eq, and }) => and(eq(t.name, prod.name), eq(t.tenantId, tenantId))
            });

            const width = 'width' in prod ? (prod as { width: number }).width : null;
            const fold = 'fold' in prod ? (prod as { fold: number }).fold : null;

            if (existing) {
                templateIds[prod.key] = existing.id;
            } else {
                const [t] = await db.insert(schema.productTemplates).values({
                    tenantId,
                    name: prod.name,
                    category: prod.category,
                    unitPrice: prod.price.toString(),
                    defaultWidth: width?.toString() ?? null,
                    defaultFoldRatio: fold?.toString() ?? null,
                    tags: ['SEED']
                }).returning();
                templateIds[prod.key] = t.id;
            }
        }

        // Link Plan Items
        const planItemsData = [
            // ECONOMIC
            { plan: 'ECONOMIC', temp: 'eco_fabric', role: 'FABRIC' },
            { plan: 'ECONOMIC', temp: 'eco_sheer', role: 'SHEER' },
            { plan: 'ECONOMIC', temp: 'eco_track', role: 'TRACK' },

            // COMFORT
            { plan: 'COMFORT', temp: 'com_fabric', role: 'FABRIC' },
            { plan: 'COMFORT', temp: 'com_sheer', role: 'SHEER' },
            { plan: 'COMFORT', temp: 'com_track', role: 'TRACK' },

            // LUXURY
            { plan: 'LUXURY', temp: 'lux_fabric', role: 'FABRIC' },
            { plan: 'LUXURY', temp: 'lux_sheer', role: 'SHEER' },
            { plan: 'LUXURY', temp: 'lux_track', role: 'TRACK' },
            { plan: 'LUXURY', temp: 'lux_valance', role: 'VALANCE' },
        ];

        console.log('Linking Plan Items...');
        for (const item of planItemsData) {
            if (!planIds[item.plan] || !templateIds[item.temp]) continue;

            // Check existence
            const existing = await db.query.quotePlanItems.findFirst({
                where: (t, { eq, and }) => and(
                    eq(t.planId, planIds[item.plan]),
                    eq(t.templateId, templateIds[item.temp])
                )
            });

            if (!existing) {
                await db.insert(schema.quotePlanItems).values({
                    planId: planIds[item.plan],
                    templateId: templateIds[item.temp],
                    role: item.role as typeof schema.quotePlanItems.$inferInsert.role
                });
            }
        }

        console.log('✅ Seeding Completed!');
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    } finally {
        await client.end();
    }
    process.exit(0);
}

seed();

