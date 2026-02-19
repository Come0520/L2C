// Lead 分配引擎 - 内部业务逻辑（非 Server Action）

import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { getSettingInternal } from "@/features/settings/actions/system-settings-actions";
import { AuditService } from '@/shared/services/audit-service';
import type { PgTransaction } from 'drizzle-orm/pg-core';

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

/**
 * 租户设置结构（用于类型安全访问）
 */
interface TenantSettings {
    distribution?: Partial<DistributionConfig>;
    [key: string]: unknown;
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
    // 1. 从新系统设置表中获取分配规则（使用统一的键名）
    const assignRule = await getSettingInternal('LEAD_AUTO_ASSIGN_RULE', tenantId) as DistributionStrategy;

    // 2. 从原租户设置中获取轮转指针等数据
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const settings = tenant?.settings as { distribution?: Partial<DistributionConfig> } | null;

    return {
        ...DEFAULT_CONFIG,
        ...settings?.distribution,
        strategy: assignRule || 'MANUAL' // 优先使用新设置表的规则
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

    const currentSettings = (tenant?.settings as TenantSettings) || {};
    const newSettings: TenantSettings = {
        ...currentSettings,
        distribution: {
            ...currentSettings.distribution,
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
 * 执行轮转分配（使用事务保证原子性）
 * 按销售顺序依次分配新线索
 */
export async function distributeToNextSales(
    tenantId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    externalTx?: PgTransaction<any, any, any> // Drizzle 事务类型泛型过于复杂，此处使用 any
): Promise<{
    salesId: string | null;
    salesName: string | null;
    strategy: DistributionStrategy;
}> {
    // 包装逻辑：如果有外部事务则直接使用，否则创建新事务
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const executeLogic = async (tx: PgTransaction<any, any, any>) => {
        // 使用 FOR UPDATE 锁定租户记录，防止并发分配
        const [tenant] = await tx.select()
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .for('update');

        if (!tenant) {
            return { salesId: null, salesName: null, strategy: 'MANUAL' as DistributionStrategy };
        }

        // 获取分配策略
        const assignRule = await getSettingInternal('LEAD_AUTO_ASSIGN_RULE', tenantId) as DistributionStrategy;
        const settings = tenant.settings as { distribution?: Partial<DistributionConfig> } | null;
        const config: DistributionConfig = {
            ...DEFAULT_CONFIG,
            ...settings?.distribution,
            strategy: assignRule || 'MANUAL'
        };

        // 手动模式：不自动分配
        if (config.strategy === 'MANUAL') {
            return { salesId: null, salesName: null, strategy: 'MANUAL' as DistributionStrategy };
        }

        // 获取可用销售列表
        const salesUsers = await tx.select({ id: users.id, name: users.name })
            .from(users)
            .where(and(
                eq(users.tenantId, tenantId),
                eq(users.isActive, true)
            ));
        const salesList = salesUsers.map(u => ({ id: u.id, name: u.name || '' }));

        if (salesList.length === 0) {
            return { salesId: null, salesName: null, strategy: config.strategy };
        }

        // 轮转分配
        if (config.strategy === 'ROUND_ROBIN') {
            const currentIndex = config.nextSalesIndex % salesList.length;
            const nextSales = salesList[currentIndex];
            const newIndex = (currentIndex + 1) % salesList.length;

            // 原子更新指针
            const currentSettings = (tenant.settings as TenantSettings) || {};
            const newSettings: TenantSettings = {
                ...currentSettings,
                distribution: {
                    ...currentSettings.distribution,
                    nextSalesIndex: newIndex
                }
            };

            await tx.update(tenants)
                .set({ settings: newSettings })
                .where(eq(tenants.id, tenantId));

            // 审计日志：记录自动轮转分配
            await AuditService.log(tx as unknown as Parameters<typeof AuditService.log>[0], {
                tableName: 'leads',
                recordId: tenantId, // 此处暂用 tenantId，实际线索ID由调用方补充
                action: 'AUTO_ASSIGN',
                tenantId,
                details: { strategy: 'ROUND_ROBIN', assignedSalesId: nextSales.id, assignedSalesName: nextSales.name },
            });

            return {
                salesId: nextSales.id,
                salesName: nextSales.name,
                strategy: 'ROUND_ROBIN' as DistributionStrategy
            };
        }

        // 暂未实现的策略
        if (config.strategy === 'LOAD_BALANCE' || config.strategy === 'CHANNEL_SPECIFIC') {
            console.warn(`[Distribution] Strategy ${config.strategy} is not yet implemented. Falling back to MANUAL.`);
            return { salesId: null, salesName: null, strategy: config.strategy };
        }

        return { salesId: null, salesName: null, strategy: config.strategy };
    };

    if (externalTx) {
        return await executeLogic(externalTx);
    } else {
        return await db.transaction(async (tx) => {
            return await executeLogic(tx);
        });
    }
}

/**
 * 配置租户的分配策略
 * 需要 SETTINGS.MANAGE 权限
 */
export async function configureDistributionStrategy(
    strategy: DistributionStrategy,
    salesPool?: string[]
): Promise<void> {
    // 认证和权限检查
    const { auth, checkPermission } = await import('@/shared/lib/auth');
    const { PERMISSIONS } = await import('@/shared/config/permissions');

    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const tenantId = session.user.tenantId;
    await updateTenantDistributionConfig(tenantId, {
        strategy,
        salesPool: salesPool || [],
        nextSalesIndex: 0 // 重置指针
    });
}

/**
 * 获取当前分配状态 (用于管理界面展示)
 */
export async function getDistributionStatus(): Promise<{
    strategy: DistributionStrategy;
    salesPool: { id: string; name: string }[];
    nextSalesIndex: number;
    nextSalesName: string | null;
}> {
    // 认证检查
    const { auth } = await import('@/shared/lib/auth');
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;

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
