import 'dotenv/config';
import { db } from './src/shared/api/db';
import * as schema from './src/shared/api/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('🌱 开始播种设计师与合作伙伴数据...\n');

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

    // 3. Create Designers
    const designers = [
        { name: '王设计', phone: '13600001001', type: 'DESIGNER' },
        { name: '李创意', phone: '13600001002', type: 'DESIGNER' },
        { name: '张空间', phone: '13600001003', type: 'DESIGNER' },
        { name: '刘美学', phone: '13600001004', type: 'DESIGNER' },
        { name: '陈艺术', phone: '13600001005', type: 'DESIGNER' },
    ];

    console.log('\n🎨 Creating Designers...');
    for (const d of designers) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const customerNo = `C-DES-${timestamp}${random}`;
        await db.insert(schema.customers).values({
            tenantId: tenant.id,
            customerNo: customerNo,
            name: d.name,
            phone: d.phone,
            type: 'DESIGNER',
            level: 'B',
            assignedSalesId: salesUser.id,
            createdBy: salesUser.id,
            defaultAddress: '设计工作室',
        }).onConflictDoNothing();
        console.log(`   - ${d.name}`);
    }

    // 4. Create Partners
    const partners = [
        { name: '金牌装修', phone: '13600002001', type: 'PARTNER' },
        { name: '顶固建材', phone: '13600002002', type: 'PARTNER' },
        { name: '美家家居', phone: '13600002003', type: 'PARTNER' },
        { name: '阳光地产', phone: '13600002004', type: 'PARTNER' },
    ];

    console.log('\n🤝 Creating Partners...');
    for (const p of partners) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const customerNo = `C-PAR-${timestamp}${random}`;
        await db.insert(schema.customers).values({
            tenantId: tenant.id,
            customerNo: customerNo,
            name: p.name,
            phone: p.phone,
            type: 'PARTNER',
            level: 'B',
            assignedSalesId: salesUser.id,
            createdBy: salesUser.id,
            defaultAddress: '合作商铺',
        }).onConflictDoNothing();
        console.log(`   - ${p.name}`);
    }

    console.log('\n✅ Data seeding completed successfully!');
    process.exit(0);
}

main().catch(console.error);
