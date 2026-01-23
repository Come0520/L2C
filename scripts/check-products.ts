import 'dotenv/config';
import { db } from '@/shared/api/db';
import { products, tenants, users } from '@/shared/api/schema';
import { desc, eq, sql } from 'drizzle-orm';

async function main() {
    // 获取所有租户
    const allTenants = await db.query.tenants.findMany();
    console.log('所有租户:');
    allTenants.forEach(t => console.log(`  ID: ${t.id} | 名称: ${t.name} | 代码: ${t.code}`));

    // 获取商品按租户分组统计
    const productsByTenant = await db
        .select({
            tenantId: products.tenantId,
            count: sql<number>`count(*)::int`
        })
        .from(products)
        .groupBy(products.tenantId);

    console.log('\n商品按租户分布:');
    for (const row of productsByTenant) {
        const tenant = allTenants.find(t => t.id === row.tenantId);
        console.log(`  租户 ${tenant?.name || row.tenantId}: ${row.count} 个商品`);
    }

    // 获取最近添加的5个商品
    const recentProducts = await db.query.products.findMany({
        limit: 5,
        orderBy: [desc(products.createdAt)]
    });

    console.log('\n最近添加的5个商品:');
    recentProducts.forEach(p => {
        const tenant = allTenants.find(t => t.id === p.tenantId);
        console.log(`  SKU: ${p.sku} | 名称: ${p.name} | 租户: ${tenant?.name || p.tenantId}`);
    });

    // 获取用户信息
    const allUsers = await db.query.users.findMany({ limit: 3 });
    console.log('\n用户信息 (前3个):');
    allUsers.forEach(u => {
        const tenant = allTenants.find(t => t.id === u.tenantId);
        console.log(`  ID: ${u.id} | 名称: ${u.name} | 租户: ${tenant?.name || u.tenantId}`);
    });

    process.exit(0);
}

main().catch(console.error);
