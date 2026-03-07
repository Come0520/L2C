/**
 * 用量统计服务
 * 负责查询租户的实时资源用量，并结合套餐限额进行检查
 */
import { db } from '@/shared/api/db';
import { eq, and, gte, count } from 'drizzle-orm';
import * as schema from '@/shared/api/schema';
import {
  type PlanResource,
  type PlanLimitCheckResult,
  checkLimit,
  type TenantOverride,
} from './plan-limits';

/** 租户用量快照 */
export interface TenantUsageSnapshot {
  userCount: number;
  customerCount: number;
  quoteCountMonth: number;
  orderCountMonth: number;
  showroomProductCount: number;
  storageUsedBytes: number;
}

/**
 * 获取当月第一天（UTC+8）
 * 用于统计"本月"数量级资源
 */
function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * 查询租户当前的实时用量
 * 直接聚合各业务表的 COUNT，不依赖快照表
 */
export async function getCurrentUsage(tenantId: string): Promise<TenantUsageSnapshot> {
  const monthStart = getMonthStart();

  // 并行查询各维度
  const [usersResult, customersResult, quotesResult, ordersResult, showroomResult] =
    await Promise.all([
      // 活跃用户数
      db
        .select({ count: count() })
        .from(schema.users)
        .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.isActive, true))),

      // 客户总数
      db
        .select({ count: count() })
        .from(schema.customers)
        .where(eq(schema.customers.tenantId, tenantId)),

      // 本月报价单数
      db
        .select({ count: count() })
        .from(schema.quotes)
        .where(and(eq(schema.quotes.tenantId, tenantId), gte(schema.quotes.createdAt, monthStart))),

      // 本月订单数
      db
        .select({ count: count() })
        .from(schema.orders)
        .where(and(eq(schema.orders.tenantId, tenantId), gte(schema.orders.createdAt, monthStart))),

      // 云展厅产品数（仅统计已发布的内容）
      db
        .select({ count: count() })
        .from(schema.showroomItems) // Changed from schema.showroomProducts
        .where(
          and(
            eq(schema.showroomItems.tenantId, tenantId),
            eq(schema.showroomItems.status, 'PUBLISHED') // Changed from isActive, and value to 'PUBLISHED'
          )
        ),
    ]);

  return {
    userCount: usersResult[0]?.count ?? 0,
    customerCount: customersResult[0]?.count ?? 0,
    quoteCountMonth: quotesResult[0]?.count ?? 0,
    orderCountMonth: ordersResult[0]?.count ?? 0,
    showroomProductCount: showroomResult[0]?.count ?? 0,
    storageUsedBytes: 0, // 暂不统计存储，后续接入 OSS 时补充
  };
}

/**
 * 查询租户某项资源的当前用量
 */
export async function getResourceUsage(tenantId: string, resource: PlanResource): Promise<number> {
  const usage = await getCurrentUsage(tenantId);

  const resourceMap: Record<PlanResource, number> = {
    users: usage.userCount,
    customers: usage.customerCount,
    quotesPerMonth: usage.quoteCountMonth,
    ordersPerMonth: usage.orderCountMonth,
    showroomProducts: usage.showroomProductCount,
    storageBytes: usage.storageUsedBytes,
  };

  return resourceMap[resource];
}

/**
 * 完整的套餐限额检查（含数据库查询）
 *
 * @param tenantId - 租户 ID
 * @param subscription - 包含重写覆盖项的租户订阅包
 * @param resource - 要检查的资源类型
 * @returns 限额检查结果
 *
 * @example
 * ```ts
 * const result = await checkPlanLimit(tenantId, sub, 'users');
 * if (!result.allowed) {
 *   // 展示升级弹窗
 * }
 * ```
 */
export async function checkPlanLimit(
  tenantId: string,
  subscription: TenantOverride & { isGrandfathered: boolean },
  resource: PlanResource
): Promise<PlanLimitCheckResult> {
  // 祖父条款用户 → 不受任何限制
  if (subscription.isGrandfathered) {
    return {
      allowed: true,
      current: 0,
      limit: Infinity,
      planType: subscription.planType,
    };
  }

  const currentUsage = await getResourceUsage(tenantId, resource);
  return checkLimit(subscription, resource, currentUsage);
}

/**
 * 获取租户全部资源的用量与限额对比
 * 用于用量仪表盘展示
 */
export async function getUsageSummary(
  tenantId: string,
  subscription: TenantOverride & { isGrandfathered: boolean }
): Promise<Record<PlanResource, PlanLimitCheckResult>> {
  const usage = await getCurrentUsage(tenantId);

  const resources: PlanResource[] = [
    'users',
    'customers',
    'quotesPerMonth',
    'ordersPerMonth',
    'showroomProducts',
    'storageBytes',
  ];

  const usageMap: Record<PlanResource, number> = {
    users: usage.userCount,
    customers: usage.customerCount,
    quotesPerMonth: usage.quoteCountMonth,
    ordersPerMonth: usage.orderCountMonth,
    showroomProducts: usage.showroomProductCount,
    storageBytes: usage.storageUsedBytes,
  };

  const result = {} as Record<PlanResource, PlanLimitCheckResult>;

  for (const resource of resources) {
    if (subscription.isGrandfathered) {
      result[resource] = {
        allowed: true,
        current: usageMap[resource],
        limit: Infinity,
        planType: subscription.planType,
      };
    } else {
      result[resource] = checkLimit(subscription, resource, usageMap[resource]);
    }
  }

  return result;
}
