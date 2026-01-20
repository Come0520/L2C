import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    console.log('🌱 开始为 [TEST001] 播种设计师与合作伙伴数据...\n');

    // 1. Get Tenant TEST001
    const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.code, 'TEST001')
    });
    if (!tenant) {
        console.error('❌ Error: Tenant TEST001 not found.');
        process.exit(1);
    }

    // 2. Get Admin User (To assign as creator/sales)
    const adminUser = await db.query.users.findFirst({
        where: and(
            eq(schema.users.tenantId, tenant.id),
            eq(schema.users.phone, '13800000000')
        )
    });

    if (!adminUser) {
        console.error('❌ Error: Test Admin user not found.');
        process.exit(1);
    }
    console.log(`👤 Using User: ${adminUser.name}`);

    // 3. Create Designers
    const designers = [
        { name: '测试设计师-张三', phone: '13700001001', type: 'DESIGNER' },
        { name: '测试设计师-李四', phone: '13700001002', type: 'DESIGNER' },
    ];

    console.log('\n🎨 Creating Designers...');
    for (const d of designers) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const customerNo = `C-DES-T-${timestamp}${random}`;

        await db.insert(schema.customers).values({
            tenantId: tenant.id,
            customerNo: customerNo,
            name: d.name,
            phone: d.phone,
            type: 'DESIGNER',
            level: 'B',
            assignedSalesId: adminUser.id,
            createdBy: adminUser.id,
            defaultAddress: '测试设计工作室',
        }).onConflictDoNothing();
        console.log(`   - ${d.name}`);
    }

    // 4. Create Partners
    const partners = [
        { name: '测试装修公司-A', phone: '13700002001', type: 'PARTNER' },
        { name: '测试建材商-B', phone: '13700002002', type: 'PARTNER' },
    ];

    console.log('\n🤝 Creating Partners...');
    for (const p of partners) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const customerNo = `C-PAR-T-${timestamp}${random}`;

        await db.insert(schema.customers).values({
            tenantId: tenant.id,
            customerNo: customerNo,
            name: p.name,
            phone: p.phone,
            type: 'PARTNER',
            level: 'B',
            assignedSalesId: adminUser.id,
            createdBy: adminUser.id,
            defaultAddress: '测试合作商铺',
        }).onConflictDoNothing();
        console.log(`   - ${p.name}`);
    }

    console.log('\n✅ TEST001 Partners Seeding Completed!');
    process.exit(0);
}

main().catch(console.error);
