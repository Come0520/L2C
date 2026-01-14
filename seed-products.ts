import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🌱 开始播种产品数据...\n');

    // 1. Get Tenant
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'DEMO')
    });
    if (!tenant) {
        console.error('❌ Error: Demo Tenant not found. Please run full seed first.');
        return;
    }

    // 2. Get Sales User
    // Try to find a sales user, default to any user if specific one not found
    let salesUser = await db.query.users.findFirst({
        where: (users, { like }) => like(users.name, '%销售%')
    });
    if (!salesUser) {
        salesUser = await db.query.users.findFirst();
        if (!salesUser) {
            console.error('❌ Error: No users found.');
            return;
        }
    }
    console.log(`👤 Using Sales User: ${salesUser.name}`);

    // 3. Create Products
    const products = [
        {
            name: '珍珠白',
            sku: 'FAB-PW-001',
            basePrice: 25,
            unit: 'm',
            isActive: true,
            description: '经典白色窗帘布料，适合简约风格',
        },
        {
            name: '米灰',
            sku: 'FAB-MG-002',
            basePrice: 35,
            unit: 'm',
            isActive: true,
            description: '中性灰色调，百搭选择',
        },
        {
            name: '深蓝',
            sku: 'FAB-DB-003',
            basePrice: 45,
            unit: 'm',
            isActive: true,
            description: '深蓝色调，适合北向窗户',
        },
        {
            name: '浅咖',
            sku: 'FAB-LC-004',
            basePrice: 28,
            unit: 'm',
            isActive: true,
            description: '浅咖啡色，温馨舒适',
        },
        {
            name: '米白',
            sku: 'WP-001',
            basePrice: 12,
            unit: 'roll',
            isActive: true,
            description: '米白色墙纸，适合简约风格',
        },
        {
            name: '浅灰',
            sku: 'WP-MG-002',
            basePrice: 15,
            unit: 'roll',
            isActive: true,
            description: '浅灰色调墙纸，适合现代风格',
        },
        {
            name: '浅蓝',
            sku: 'WP-LB-003',
            basePrice: 18,
            unit: 'roll',
            isActive: true,
            description: '浅蓝色调墙纸，适合北向窗户',
        },
    ];

    console.log('\n🎨 Creating Products...');
    for (const p of products) {
        const existing = await db.query.products.findFirst({
            where: eq(schema.products.sku, p.sku)
        });

        if (existing) {
            console.log(`   ⚠️  Skipping ${p.sku} (Already exists)`);
            continue;
        }

        await db.insert(schema.products).values({
            ...p,
            basePrice: p.basePrice.toString(),
            tenantId: tenant.id,
            category: 'CURTAIN_FABRIC',
            fabricDirection: 'HEIGHT',
            headerProcessType: 'WRAPPED',
        });
        console.log(`   ✅ Inserted ${p.name} (${p.sku})`);
    }

    console.log('\n✨ Done!');
    process.exit(0);
}

main().catch(console.error);
