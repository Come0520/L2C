'use server';

/**
 * AI 渲染数据库查询层
 * 提供渲染历史、积分余额等查询函数，严格进行租户隔离
 */

import { db } from '@/shared/api/db';
import { aiRenderings } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { getPlanLimit } from '@/features/billing/lib/plan-limits';

// ==================== 渲染历史查询 ====================

/**
 * 获取当前用户在当前租户下的渲染历史列表
 * 按创建时间倒序，最多返回最近 50 条
 *
 * @returns 渲染记录数组
 * @throws {Error} 未登录或缺少租户 ID 时抛出
 */
export async function getMyRenderingHistory() {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error('Unauthorized: 未登录或缺少租户信息');
  }

  const { tenantId, id: userId } = session.user;

  return db.query.aiRenderings.findMany({
    where: and(eq(aiRenderings.tenantId, tenantId), eq(aiRenderings.userId, userId)),
    orderBy: [desc(aiRenderings.createdAt)],
    limit: 50,
  });
}

// ==================== 积分余额查询 ====================

/** 积分余额返回结构 */
export interface CreditBalanceResult {
  /** 套餐总额度 */
  total: number;
  /** 当月已使用积分 */
  used: number;
  /** 剩余可用积分 */
  remaining: number;
  /** 套餐类型 */
  planType: string;
}

/**
 * 获取当前租户的 AI 渲染积分余额
 * 计算当月已消耗积分，和套餐总额对比得出剩余量
 *
 * @returns 积分余额信息
 * @throws {Error} 未登录时抛出
 */
export async function getCreditBalance(): Promise<CreditBalanceResult> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized: 未登录或缺少租户信息');
  }

  const { tenantId } = session.user;
  const planType = (session.user as { planType?: string }).planType ?? 'base';

  // 获取套餐积分额度
  const total = getPlanLimit(planType as 'base' | 'pro' | 'enterprise', 'aiRenderingCredits');

  // 计算当月已消耗（仅统计成功的渲染）
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const successfulRenderings = await db.query.aiRenderings.findMany({
    where: and(eq(aiRenderings.tenantId, tenantId), eq(aiRenderings.status, 'COMPLETED')),
    columns: { creditsUsed: true, createdAt: true },
  });

  const used = successfulRenderings
    .filter((r) => r.createdAt >= startOfMonth)
    .reduce((sum, r) => sum + (r.creditsUsed ?? 0), 0);

  return {
    total: Number.isFinite(total) ? total : 9999,
    used,
    remaining: Number.isFinite(total) ? Math.max(0, total - used) : 9999,
    planType,
  };
}

// ==================== 单条渲染查询 ====================

/**
 * 根据 ID 查询单条渲染记录（带租户隔离）
 *
 * @param params.id 渲染记录 ID
 * @returns 渲染記录，不存在时返回 null
 * @throws {Error} 未登录时抛出
 */
export async function getRenderingById({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized: 未登录或缺少租户信息');
  }

  const { tenantId } = session.user;

  return db.query.aiRenderings.findFirst({
    where: and(eq(aiRenderings.id, id), eq(aiRenderings.tenantId, tenantId)),
  });
}
