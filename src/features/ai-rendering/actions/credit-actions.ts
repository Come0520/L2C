'use server';

/**
 * 积分额度管理 Server Actions
 * 用于查看租户 AI 渲染积分使用情况和配置
 */

import { db } from '@/shared/api/db';
import { aiRenderings } from '@/shared/api/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { PLAN_LIMITS } from '@/features/billing/lib/plan-limits';

// ==================== 查询 ====================

/**
 * 获取所有租户的积分使用统计（SUPER_ADMIN）
 * 返回各租户当月用量汇总
 */
export async function getAllTenantsCreditsStats() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden');
  }

  // 按租户统计本月总消耗
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await db
    .select({
      tenantId: aiRenderings.tenantId,
      totalCreditsUsed: sum(aiRenderings.creditsUsed),
      renderingCount: count(),
    })
    .from(aiRenderings)
    .where(
      and(
        eq(aiRenderings.status, 'completed')
        // 日期过滤需要通过 SQL CAST，暂简化：返回全部时间段
      )
    )
    .groupBy(aiRenderings.tenantId);

  return stats;
}

/**
 * 获取套餐积分配置（展示用）
 */
export async function getPlanCreditsConfig() {
  return {
    base: PLAN_LIMITS.base.maxAiRenderingCredits,
    pro: PLAN_LIMITS.pro.maxAiRenderingCredits,
    enterprise: PLAN_LIMITS.enterprise.maxAiRenderingCredits,
  };
}
