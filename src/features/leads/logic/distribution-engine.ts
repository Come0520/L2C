'use server';

import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 分配策略类型
 */
export type DistributionStrategy = 'MANUAL' | 'ROUND_ROBIN' | 'LOAD_BALANCE' | 'CHANNEL_SPECIFIC';

/**
 * 租户分配配置
 */
interface DistributionConfig {
    strategy: DistributionStrategy;
    nextSalesIndex: number;
    salesPool: string[]; // 参与轮转的销售ID列表
}

const DEFAULT_CONFIG: DistributionConfig = {
    strategy: 'MANUAL',
    nextSalesIndex: 0,
    salesPool: []
};

/**
 * 获取租户分配配置
 */
async function getTenantDistributionConfig(tenantId: string): Promise<DistributionConfig> {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const settings = tenant?.settings as { distribution?: Partial<DistributionConfig> } | null;
    return {
        ...DEFAULT_CONFIG,
        ...settings?.distribution
    };
}

/**
 * 更新租户分配配置
 */
async function updateTenantDistributionConfig(
    tenantId: string,
    updates: Partial<DistributionConfig>
): Promise<void> {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const currentSettings = (tenant?.settings as object) || {};
    const newSettings = {
        ...currentSettings,
        distribution: {
            ...(currentSettings as any).distribution,
            ...updates
        }
    };

    await db.update(tenants)
        .set({ settings: newSettings })
        .where(eq(tenants.id, tenantId));
}

/**
 * 获取可用销售列表
 * 排除离职、请假等不可分配状态的销售
 */
async function getAvailableSalesList(tenantId: string): Promise<{ id: string; name: string }[]> {
    const salesUsers = await db.query.users.findMany({
        where: and(
            eq(users.tenantId, tenantId),
            eq(users.isActive, true)
            // 可以添加更多条件：角色=销售、未请假等
        ),
        columns: { id: true, name: true }
    });

    return salesUsers.map(u => ({ id: u.id, name: u.name || '' }));
}

/**
 * 执行轮转分配
 * 按销售顺序依次分配新线索
 */
export async function distributeToNextSales(tenantId: string): Promise<{
    salesId: string | null;
    salesName: string | null;
    strategy: DistributionStrategy;
}> {
    const config = await getTenantDistributionConfig(tenantId);

    // 手动模式：不自动分配
    if (config.strategy === 'MANUAL') {
        return { salesId: null, salesName: null, strategy: 'MANUAL' };
    }

    // 获取可用销售列表
    const salesList = await getAvailableSalesList(tenantId);
    if (salesList.length === 0) {
        return { salesId: null, salesName: null, strategy: config.strategy };
    }

    // 轮转分配
    if (config.strategy === 'ROUND_ROBIN') {
        const currentIndex = config.nextSalesIndex % salesList.length;
        const nextSales = salesList[currentIndex];

        // 更新指针
        await updateTenantDistributionConfig(tenantId, {
            nextSalesIndex: (currentIndex + 1) % salesList.length
        });

        return {
            salesId: nextSales.id,
            salesName: nextSales.name,
            strategy: 'ROUND_ROBIN'
        };
    }

    // TODO: 负载均衡模式 - 优先分配给线索最少的销售
    // if (config.strategy === 'LOAD_BALANCE') { ... }

    // TODO: 渠道指定模式 - 特定渠道分配给指定销售
    // if (config.strategy === 'CHANNEL_SPECIFIC') { ... }

    return { salesId: null, salesName: null, strategy: config.strategy };
}

/**
 * 配置租户的分配策略
 */
export async function configureDistributionStrategy(
    tenantId: string,
    strategy: DistributionStrategy,
    salesPool?: string[]
): Promise<void> {
    await updateTenantDistributionConfig(tenantId, {
        strategy,
        salesPool: salesPool || [],
        nextSalesIndex: 0 // 重置指针
    });
}

/**
 * 获取当前分配状态 (用于管理界面展示)
 */
export async function getDistributionStatus(tenantId: string): Promise<{
    strategy: DistributionStrategy;
    salesPool: { id: string; name: string }[];
    nextSalesIndex: number;
    nextSalesName: string | null;
}> {
    const config = await getTenantDistributionConfig(tenantId);
    const salesList = await getAvailableSalesList(tenantId);

    const nextIndex = config.nextSalesIndex % Math.max(1, salesList.length);
    const nextSales = salesList[nextIndex];

    return {
        strategy: config.strategy,
        salesPool: salesList,
        nextSalesIndex: config.nextSalesIndex,
        nextSalesName: nextSales?.name || null
    };
}
