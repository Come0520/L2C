'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { showroomViewLogs, showroomShares, showroomItems } from '@/shared/api/schema/showroom';
import { eq, sql, desc, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { reportViewStatsSchema, getViewStatsReportSchema } from './view-stats-schema';
import { ShowroomError, ShowroomErrors } from '../errors';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('ShowroomViewStats');

/**
 * 上报客户浏览素材的停留时间
 * 由小程序前端在客户退出展厅或切换素材时调用
 */
export async function reportViewStats(input: z.input<typeof reportViewStatsSchema>) {
  const { shareId, visitorUserId, items } = reportViewStatsSchema.parse(input);

  // 查询分享记录获取 tenantId
  const share = await db.query.showroomShares.findFirst({
    where: eq(showroomShares.id, shareId),
    columns: { tenantId: true, salesId: true },
  });

  if (!share) {
    throw new ShowroomError(ShowroomErrors.SHARE_NOT_FOUND);
  }

  // 批量插入浏览记录
  const values = items.map((item) => ({
    tenantId: share.tenantId,
    shareId,
    itemId: item.itemId,
    visitorUserId,
    durationSeconds: item.durationSeconds,
  }));

  await db.insert(showroomViewLogs).values(values);

  logger.info('展厅浏览停留时间上报成功', {
    shareId,
    visitorUserId,
    itemCount: items.length,
  });

  return { success: true, recordCount: items.length };
}

/**
 * 获取分享链接的浏览统计报告
 * 仅分享链接的创建者（salesId）可查询
 * 返回按停留时间排序的 Top N 素材
 */
export async function getViewStatsReport(input: z.input<typeof getViewStatsReportSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);
  }

  const { shareId, limit } = getViewStatsReportSchema.parse(input);

  // 验证分享链接归属
  const share = await db.query.showroomShares.findFirst({
    where: and(eq(showroomShares.id, shareId), eq(showroomShares.salesId, session.user.id)),
    columns: { id: true },
  });

  if (!share) {
    throw new ShowroomError(ShowroomErrors.FORBIDDEN);
  }

  // 聚合统计：按素材分组，计算总停留时长、浏览次数、平均时长
  const stats = await db
    .select({
      itemId: showroomViewLogs.itemId,
      totalDuration: sql<number>`SUM(${showroomViewLogs.durationSeconds})`.as('total_duration'),
      viewCount: sql<number>`COUNT(*)`.as('view_count'),
      avgDuration: sql<number>`ROUND(AVG(${showroomViewLogs.durationSeconds}))`.as('avg_duration'),
    })
    .from(showroomViewLogs)
    .where(eq(showroomViewLogs.shareId, shareId))
    .groupBy(showroomViewLogs.itemId)
    .orderBy(desc(sql`total_duration`))
    .limit(limit);

  // 关联素材标题
  const itemIds = stats.map((s) => s.itemId);
  const itemDetailsMap = new Map<string, string>();

  if (itemIds.length > 0) {
    const { inArray } = await import('drizzle-orm');
    const details = await db.query.showroomItems.findMany({
      where: inArray(showroomItems.id, itemIds),
      columns: { id: true, title: true },
    });
    details.forEach((d) => itemDetailsMap.set(d.id, d.title));
  }

  const report = stats.map((s) => ({
    itemId: s.itemId,
    title: itemDetailsMap.get(s.itemId) || '未知素材',
    totalDuration: Number(s.totalDuration) || 0,
    viewCount: Number(s.viewCount) || 0,
    avgDuration: Number(s.avgDuration) || 0,
  }));

  logger.info('展厅浏览统计报告生成', { shareId, itemCount: report.length });

  return { success: true, data: report };
}
