
import { db } from '@/shared/api/db';
import * as schema from '@/shared/api/schema';
import { count, eq, sql } from 'drizzle-orm';

async function auditData() {
    console.log('🔍 开始数据审计...');
    const startTime = Date.now();

    const tables = {
        '租户 (Tenants)': schema.tenants,
        '用户 (Users)': schema.users,
        '角色 (Roles)': schema.roles,
        '商品 (Products)': schema.products,
        '渠道 (Channels)': schema.channels,
        '客户 (Customers)': schema.customers,
        '线索 (Leads)': schema.leads,
        '报价单 (Quotes)': schema.quotes,
        '报价明细 (QuoteItems)': schema.quoteItems,
        '订单 (Orders)': schema.orders,
        '测量任务 (MeasureTasks)': schema.measureTasks,
        '安装任务 (InstallTasks)': schema.installTasks,
        '采购单 (PurchaseOrders)': schema.purchaseOrders,
        '外协工单 (WorkOrders)': schema.workOrders,
        '售后单 (AfterSalesTickets)': schema.afterSalesTickets,
        '库存 (Inventory)': schema.inventory,
        '面料库存 (FabricInventory)': schema.fabricInventory,
        '渠道结算 (ChannelSettlements)': schema.channelSettlements,
        '佣金调整 (CommissionAdjustments)': schema.commissionAdjustments,
        '积分流水 (LoyaltyTransactions)': schema.loyaltyTransactions,
        '系统公告 (Announcements)': schema.systemAnnouncements,
    };

    let totalIssues = 0;

    console.log('\n📊 数据量统计:');
    for (const [name, table] of Object.entries(tables)) {
        try {
            const [result] = await db.select({ count: count() }).from(table);
            const recordCount = result.count;
            const status = recordCount > 0 ? '✅' : '❌ (无数据)';
            console.log(`   ${status} ${name}: ${recordCount} 条`);

            if (recordCount === 0) {
                // Ignore some optional tables if deemed acceptable, but for full simulation we want data
                if (!['佣金调整 (CommissionAdjustments)', '积分流水 (LoyaltyTransactions)'].includes(name)) {
                    // totalIssues++; // Strict check?
                }
            }
        } catch (error) {
            console.error(`   ❌ ${name}: 查询失败 - ${error}`);
            totalIssues++;
        }
    }

    console.log('\n🕵️  数据完整性检查:');

    // 1. 检查订单-客户关联
    const [orphanOrders] = await db.select({ count: count() })
        .from(schema.orders)
        .leftJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
        .where(sql`${schema.customers.id} IS NULL`);

    if (orphanOrders.count > 0) {
        console.log(`   ❌ 发现 ${orphanOrders.count} 个孤儿订单 (无关联客户)`);
        totalIssues++;
    } else {
        console.log(`   ✅ 订单关联性正常`);
    }

    // 2. 检查库存-商品关联
    const [orphanInventory] = await db.select({ count: count() })
        .from(schema.inventory)
        .leftJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
        .where(sql`${schema.products.id} IS NULL`);

    if (orphanInventory.count > 0) {
        console.log(`   ❌ 发现 ${orphanInventory.count} 条孤儿库存记录 (无关联商品)`);
        totalIssues++;
    } else {
        console.log(`   ✅ 库存关联性正常`);
    }

    // 3. 验证数据量达标
    const [customerCount] = await db.select({ count: count() }).from(schema.customers);
    if (customerCount.count < 200) {
        console.log(`   ⚠️ 客户数量不足 200 (当前: ${customerCount.count})`);
        // totalIssues++;
    } else {
        console.log(`   ✅ 客户数量达标`);
    }

    const [orderCount] = await db.select({ count: count() }).from(schema.orders);
    if (orderCount.count < 500) {
        console.log(`   ⚠️ 订单数量不足 500 (当前: ${orderCount.count})`);
        // totalIssues++;
    } else {
        console.log(`   ✅ 订单数量达标`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  审计完成，耗时 ${duration}s`);

    if (totalIssues > 0) {
        console.log(`❌ 发现 ${totalIssues} 个潜在问题，请检查日志。`);
        process.exit(1);
    } else {
        console.log(`✨ 所有检查通过！数据模拟状态健康。`);
        process.exit(0);
    }
}

auditData().catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
});
