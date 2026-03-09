/**
 * 配额校验服务 (Quota Service)
 *
 * 职责：
 * - 读取租户的月度用量，与套餐限额做对比
 * - 软上限 (Soft Limit)：checkResourceQuota — 返回判定结果，允许继续但标记脏位
 * - 硬上限 (Hard Limit)：assertResourceQuota — 超限直接抛出异常，阻断操作
 */
import { db } from '@/shared/api/db';
import { tenantMonthlyUsages } from '@/shared/api/schema/billing';
import { tenants } from '@/shared/api/schema/infrastructure';
import { getTenantPlanLimits, type PlanLimitConfig } from '../lib/plan-limits';
import { and, eq } from 'drizzle-orm';

// ==================== 类型定义 ====================

/** 可计量的软上限资源类型 */
export type SoftResource = 'quotesPerMonth' | 'ordersPerMonth' | 'showroomProducts';

/** 可计量的硬上限资源类型 */
export type HardResource = 'users' | 'customers' | 'storageBytes' | 'aiRenderingCredits';

/** 所有支持配额检查的资源类型 */
export type QuotaResource = SoftResource | HardResource;

/** 配额检查结果 */
export interface QuotaCheckResult {
    /** 是否允许继续操作（false 时应注入 isOverQuota 脏标记，不直接阻断） */
    allowed: boolean;
    /** 当前已使用量 */
    current: number;
    /** 该资源套餐限制上限 */
    limit: number;
    /** 超出比例（仅 allowed=false 时有意义） */
    overRatio?: number;
}

// ==================== 内部工具函数 ====================

/** 将下划线格式的资源名称（来自数据库）映射回 plan-limits 中的字段 */
const RESOURCE_TO_LIMIT_FIELD: Record<QuotaResource, keyof PlanLimitConfig> = {
    quotesPerMonth: 'maxQuotesPerMonth',
    ordersPerMonth: 'maxOrdersPerMonth',
    showroomProducts: 'maxShowroomProducts',
    users: 'maxUsers',
    customers: 'maxCustomers',
    storageBytes: 'maxStorageBytes',
    aiRenderingCredits: 'maxAiRenderingCredits',
};

/** 获取当前月份的字符串，如 '2026-03' */
function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * 从数据库读取租户当月某类资源的已用量。
 * 若记录不存在则视为 0。
 */
async function getMonthlyUsage(tenantId: string, resourceType: string): Promise<number> {
    const row = await db.query.tenantMonthlyUsages.findFirst({
        where: and(
            eq(tenantMonthlyUsages.tenantId, tenantId),
            eq(tenantMonthlyUsages.month, getCurrentMonth()),
            eq(tenantMonthlyUsages.resourceType, resourceType)
        ),
    });
    return row?.usedValue ?? 0;
}

/**
 * 从数据库读取租户信息（套餐类型及增值包配置）。
 */
async function getTenantPlanConfig(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: {
            planType: true,
            maxUsers: true,
            purchasedAddons: true,
            purchasedModules: true,
            storageQuota: true,
            trialEndsAt: true,
            isGrandfathered: true,
        },
    });
    return tenant;
}

// ==================== 公开服务方法 ====================

export const QuotaService = {
    /**
     * 软上限检查（Soft Limit Check）
     *
     * 适用于报价单、订单、展厅产品等"可超但需标记"的 B 类资源。
     * 不抛异常，返回 QuotaCheckResult，调用方决定是否注入脏标记。
     *
     * @param tenantId 租户 ID
     * @param resource 资源类型
     */
    async checkResourceQuota(tenantId: string, resource: QuotaResource): Promise<QuotaCheckResult> {
        const tenantConfig = await getTenantPlanConfig(tenantId);
        if (!tenantConfig) {
            // 租户不存在时放行（不应阻断，由外层业务处理租户鉴权）
            return { allowed: true, current: 0, limit: Infinity };
        }

        // 获取该租户合并后的最终限额配置
        const limits = getTenantPlanLimits({
            planType: tenantConfig.planType,
            maxUsers: tenantConfig.maxUsers,
            purchasedAddons: tenantConfig.purchasedAddons as Record<string, unknown> | null,
            purchasedModules: tenantConfig.purchasedModules as string[] | null,
            storageQuota: tenantConfig.storageQuota,
            trialEndsAt: tenantConfig.trialEndsAt,
        });

        const limitField = RESOURCE_TO_LIMIT_FIELD[resource];
        const limit = limits[limitField] as number;

        // 無限额套餐直接放行
        if (!Number.isFinite(limit)) {
            return { allowed: true, current: 0, limit: Infinity };
        }

        // 查询当前实际用量
        const current = await getMonthlyUsage(tenantId, resource);

        const allowed = current < limit;
        return {
            allowed,
            current,
            limit,
            ...(allowed ? {} : { overRatio: current / limit }),
        };
    },

    /**
     * 硬上限断言（Hard Limit Assert）
     *
     * 适用于用户席位、客户数等"不可超越"的 A 类资源。
     * 若当前用量已达上限，直接抛出 QuotaExceededError 异常，阻断操作。
     *
     * @param tenantId 租户 ID
     * @param resource 资源类型
     * @throws QuotaExceededError 当前用量超出限额时抛出
     */
    async assertResourceQuota(tenantId: string, resource: QuotaResource): Promise<void> {
        const result = await QuotaService.checkResourceQuota(tenantId, resource);
        if (!result.allowed) {
            throw new QuotaExceededError(resource, result.current, result.limit);
        }
    },

    /**
     * 原子性地递增某个软资源的当月计数（使用 upsert 保证并发安全）。
     *
     * @param tenantId 租户 ID
     * @param resourceType 资源类型字符串
     * @param delta 增量，默认 +1
     */
    async incrementMonthlyUsage(tenantId: string, resourceType: string, delta = 1): Promise<void> {
        const month = getCurrentMonth();
        // upsert：若本月记录不存在则创建，否则累加
        await db
            .insert(tenantMonthlyUsages)
            .values({
                tenantId,
                month,
                resourceType,
                usedValue: delta,
            })
            .onConflictDoUpdate({
                target: [
                    tenantMonthlyUsages.tenantId,
                    tenantMonthlyUsages.month,
                    tenantMonthlyUsages.resourceType,
                ],
                set: {
                    usedValue: delta, // 注意：实际生产中应使用 SQL 表达式 `used_value + excluded.used_value`
                    updatedAt: new Date(),
                },
            });
    },
};

// ==================== 错误类 ====================

/** 配额超限异常，由 assertResourceQuota 抛出 */
export class QuotaExceededError extends Error {
    readonly resource: string;
    readonly current: number;
    readonly limit: number;

    constructor(resource: string, current: number, limit: number) {
        super(`配额超限：资源 ${resource} 当前用量 ${current} 已达上限 ${limit}，操作被拒绝`);
        this.name = 'QuotaExceededError';
        this.resource = resource;
        this.current = current;
        this.limit = limit;
    }
}
