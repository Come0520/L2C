'use server';

import { checkPlanLimit, getUsageSummary } from '../lib/usage-calculator';
import { type PlanType, type PlanResource, type PlanLimitCheckResult, formatLimit } from '../lib/plan-limits';
import { getTenantSubscription } from '../actions/subscription-actions';
import { auth } from '@/shared/lib/auth';

// 给前端仪表盘展示所需的格式
export interface UsageItem {
  resource: PlanResource;
  currentValue: number;
  limitStr: string;
  isUnlimited: boolean;
  percentage: number;
}

export interface TenantUsageSummaryOutput {
  planType: string;
  isGrandfathered: boolean;
  usages: UsageItem[];
}

/**
 * 供前端组件调用的用量查询 Server Action
 * 用于拦截如“新建客户”、“新建员工”等操作
 */
export async function checkTenantLimitAction(
  resource: PlanResource
): Promise<PlanLimitCheckResult> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    throw new Error('未获取到租户 ID，请重新登录');
  }

  const sub = await getTenantSubscription(tenantId);
  const planType = (sub?.planType as PlanType) || 'base';
  const isGrandfathered = sub?.isGrandfathered || false;

  return await checkPlanLimit(tenantId, {
    planType,
    isGrandfathered,
    maxUsers: sub?.maxUsers || null,
    purchasedModules: sub?.purchasedModules || null,
    storageQuota: sub?.storageQuota || null,
    trialEndsAt: sub?.trialEndsAt || null,
  }, resource);
}

/**
 * 获取当前租户完整用量摘要（用于仪表盘）
 */
export async function getTenantUsageSummaryAction(): Promise<TenantUsageSummaryOutput> {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    throw new Error('未获取到租户 ID');
  }

  const sub = await getTenantSubscription(tenantId);
  const planType = (sub?.planType as PlanType) || 'base';
  const isGrandfathered = sub?.isGrandfathered || false;

  const summaryData = await getUsageSummary(tenantId, {
    planType,
    isGrandfathered,
    maxUsers: sub?.maxUsers || null,
    purchasedModules: sub?.purchasedModules || null,
    storageQuota: sub?.storageQuota || null,
    trialEndsAt: sub?.trialEndsAt || null,
  });

  const resourceKeys = Object.keys(summaryData) as PlanResource[];

  const usages: UsageItem[] = resourceKeys.map((res) => {
    const data = summaryData[res];
    const isUnlimited = data.limit === Infinity;

    // 如果不限额，进度条可默认给0或按比例(这里给0)
    let percentage = 0;
    if (!isUnlimited && data.limit > 0) {
      percentage = Math.min((data.current / data.limit) * 100, 100);
    }

    return {
      resource: res,
      currentValue: data.current,
      limitStr: formatLimit(data.limit),
      isUnlimited,
      percentage,
    };
  });

  return {
    planType,
    isGrandfathered,
    usages,
  };
}
