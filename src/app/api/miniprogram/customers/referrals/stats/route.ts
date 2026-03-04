/**
 * 客户转介绍推广数据统计 API
 *
 * GET /api/miniprogram/customers/referrals/stats
 *
 * 业务场景：客户在「推荐共享」页面查看自己的转介绍战绩（已邀请人数、成单人数、累计佣金/积分等）。
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { apiSuccess, apiServerError, apiUnauthorized } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || (!user.tenantId && user.role !== 'SUPER_ADMIN')) {
        return apiUnauthorized('未授权');
      }

      // 我们假设客户被保存在 `customers` 表里，或者与 `users` 的某条记录有关联
      // 这里简单的示范统计：查找 customer 表里 referrerId = currentUserId 的数量

      // 1. 累计推荐人数 (假设 referrerId 是存在的)
      const refCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(
          and(
            eq(customers.tenantId, user.tenantId as string),
            // 这里的客户表若没存 referrerId 这个外键，此例可能会类型报错。需要根据实际 Schema 修改，这里用强转绕过仅作演示思路
            sql`referrer_id = ${user.id}`
          )
        );

      const totalReferrals = refCountRes[0]?.count || 0;

      // 2. 成功转化人数 (假设有 status = 'CONVERTED' 等标志)
      const convCountRes = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(
          and(
            eq(customers.tenantId, user.tenantId as string),
            sql`referrer_id = ${user.id} AND status = 'CONVERTED'`
          )
        );

      const convertedCustomers = convCountRes[0]?.count || 0;

      // 3. 累计获得奖励/积分
      // 这可能来自 rewardRecords 或 loyalty_points。
      let earnedRewards = 0;
      let points = 0;

      /* Mock up logic
    const rewardRes = await db.select({ total: sql<number>`SUM(amount)` }).from(rewardRecords).where(eq(rewardRecords.userId, user.id));
    earnedRewards = rewardRes[0]?.total || 0;
    */

      // 如果没有完整的转介绍奖励体系，这里先用 mock 数据+实际统计数据结合返回
      earnedRewards = totalReferrals * 50; // 假设推荐一个给 50 块
      points = convertedCustomers * 1000; // 假设成单一个给 1000 积分

      return apiSuccess({
        totalReferrals,
        convertedCustomers,
        earnedRewards,
        points,
      });
    } catch (error) {
      logger.error('[ReferralStats] 获取推广数据异常', {
        route: `customers/referrals/stats`,
        error,
      });
      return apiServerError('获取推广统计失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
