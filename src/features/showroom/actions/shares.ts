'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { showroomShares, showroomItems } from '@/shared/api/schema/showroom';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { createShareLinkSchema, deactivateShareSchema, getShareContentSchema } from './schema';
import { createHash } from 'crypto';
import { AuditService } from '@/shared/services/audit-service';
import { redis } from '@/shared/lib/redis';
import { checkRateLimit } from '@/shared/middleware/rate-limit';
import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { ShowroomShareItemSnapshot } from '../types';
import { ShowroomError, ShowroomErrors } from '../errors';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('ShowroomSharesAction');

/**
 * 云展厅分享功能 Actions
 */

/**
 * 创建展厅素材分享链接
 * @param input 分享参数，包含素材列表、过期时间、改价快照等
 * @returns 分享记录 ID 和完整访问 URL
 */
export async function createShareLink(input: z.input<typeof createShareLinkSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  const { items, expiresInDays, password, maxViews } = createShareLinkSchema.parse(input);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  try {
    const itemsSnapshot: ShowroomShareItemSnapshot[] = items;
    const [shareId] = await db
      .insert(showroomShares)
      .values({
        tenantId: session.user.tenantId,
        salesId: session.user.id,
        itemsSnapshot: itemsSnapshot,
        expiresAt: expiresAt,
        passwordHash: password ? createHash('sha256').update(password).digest('hex') : null,
        maxViews: maxViews || null,
        isActive: 1,
      })
      .returning({ id: showroomShares.id });

    // 记录审计日志
    await AuditService.log(db, {
      tableName: 'showroom_shares',
      recordId: shareId.id,
      action: 'CREATE',
      userId: session.user.id,
      tenantId: session.user.tenantId,
      newValues: { items, expiresInDays, expiresAt, hasPassword: !!password, maxViews } as Record<
        string,
        unknown
      >,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/showroom/share/${shareId.id}`;

    logger.info('创建展厅共享链接成功', {
      shareId: shareId.id,
      tenantId: session.user.tenantId,
      salesId: session.user.id,
    });

    return { id: shareId.id, url };
  } catch (error) {
    logger.error('创建展厅共享链接失败', { error, input });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 获取分享内容 (供外部公开页调用)
 * 包含：
 * 1. UUID 验证与过期检查
 * 2. 采样回写浏览量到数据库
 * 3. Redis 抗压计数
 * 4. 严格的服务端限流
 * @param shareId 分享 ID
 * @throws 403/404/429 对应错误
 */
export async function getShareContent(input: z.input<typeof getShareContentSchema>) {
  const { shareId, password } = getShareContentSchema.parse(input);
  // 1. 公开限流检查
  const clientHeaders = await headers();
  const ip = clientHeaders.get('x-forwarded-for') || 'anonymous';
  const rateLimit = await checkRateLimit(`showroom_share_${ip}`, {
    max: 60,
    windowMs: 60 * 1000,
    keyType: 'ip',
    prefix: 'ratelimit:showroom',
  });

  if (!rateLimit.allowed) {
    throw new ShowroomError(ShowroomErrors.SHARE_RATE_LIMIT);
  }

  // 2. 查询分享记录 (包含 sales 信息)
  const share = await db.query.showroomShares.findFirst({
    where: eq(showroomShares.id, shareId),
    with: {
      sales: true,
    },
  });

  if (!share || share.isActive === 0) {
    throw new ShowroomError(ShowroomErrors.SHARE_NOT_FOUND);
  }

  // 检查过期
  const isExpired = share.expiresAt ? new Date() > new Date(share.expiresAt) : false;
  if (isExpired) {
    throw new ShowroomError(ShowroomErrors.SHARE_EXPIRED);
  }

  // 检查密码保护
  if (share.passwordHash) {
    if (!password) {
      throw new ShowroomError(ShowroomErrors.INVALID_PASSWORD);
    }
    const inputHash = createHash('sha256').update(password).digest('hex');
    if (inputHash !== share.passwordHash) {
      throw new ShowroomError(ShowroomErrors.INVALID_PASSWORD);
    }
  }

  // 检查阅后即焚上线 (MaxViews)
  if (share.maxViews && (share.views || 0) >= share.maxViews) {
    throw new ShowroomError(ShowroomErrors.SHARE_LIMIT_EXCEEDED);
  }

  // 3. 统计逻辑：抗压计数 (fail-closed 安全策略)
  // Redis 为核心依赖：不可用时拒绝服务，防止浏览量计数失真和并发安全问题
  if (!redis) {
    logger.error('Redis 不可用，展厅分享拒绝服务（fail-closed 安全策略）', { shareId });
    throw new ShowroomError(ShowroomErrors.REDIS_UNAVAILABLE);
  }

  // 采样回写：10% 概率回写到 DB，减轻 DB 压力
  const currentViews = await redis.incr(`showroom:share:views:${shareId}`);
  if (Math.random() < 0.1) {
    const cachedViews = await redis.get(`showroom:share:views:${shareId}`);
    await db
      .update(showroomShares)
      .set({ views: Number(cachedViews || currentViews) })
      .where(eq(showroomShares.id, shareId));
  }

  try {
    // 4. 获取详细素材内容并合并改价逻辑
    const itemsSnapshot = share.itemsSnapshot as ShowroomShareItemSnapshot[];
    const itemIds = itemsSnapshot.map((i) => i.itemId);
    const itemDetails = await db.query.showroomItems.findMany({
      where: inArray(showroomItems.id, itemIds),
    });

    const items = itemsSnapshot.map((snapshot) => {
      const detail = itemDetails.find((d) => d.id === snapshot.itemId);
      return {
        ...detail,
        overridePrice: snapshot.overridePrice, // 使用分享时的特定定价
      };
    });

    logger.info('获取展厅共享内容成功', { shareId });

    return {
      expired: false,
      items,
      sales: share.sales,
    };
  } catch (error) {
    if (error instanceof ShowroomError) throw error;
    logger.error('获取展厅共享内容失败', { error, shareId });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 获取当前用户的展厅素材分享列表
 */
export async function getMyShareLinks(page = 1, pageSize = 20) {
  const session = await auth();
  if (!session?.user?.id) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  try {
    const result = await db.query.showroomShares.findMany({
      where: and(
        eq(showroomShares.tenantId, session.user.tenantId),
        eq(showroomShares.salesId, session.user.id)
      ),
      orderBy: [desc(showroomShares.createdAt)],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    logger.info('获取我分享的链接列表成功', {
      tenantId: session.user.tenantId,
      salesId: session.user.id,
      page,
      pageSize,
    });

    return result;
  } catch (error) {
    logger.error('获取分享链接列表失败', { error, tenantId: session.user.tenantId });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 停用分享链接
 */
export async function deactivateShareLink(input: z.input<typeof deactivateShareSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  const { shareId } = deactivateShareSchema.parse(input);

  try {
    const [updated] = await db
      .update(showroomShares)
      .set({ isActive: 0 })
      .where(
        and(eq(showroomShares.id, shareId), eq(showroomShares.tenantId, session.user.tenantId))
      )
      .returning();

    if (updated) {
      await AuditService.log(db, {
        tableName: 'showroom_shares',
        recordId: shareId,
        action: 'UPDATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: { isActive: 0 } as Record<string, unknown>,
      });
      revalidateTag('showroom-list', {});
      logger.info('停用分享链接成功', { shareId, tenantId: session.user.tenantId });
    }

    return { success: !!updated };
  } catch (error) {
    logger.error('停用分享链接失败', { error, shareId });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 获取展厅分享整体看板统计信息 (供后台或大盘使用)
 * 提取全租户下产生的有效分享与总浏览趋势
 */
export async function getShareDashboardStats() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  const tenantId = session.user.tenantId;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    // 核心聚合指标查询
    const aggregated = await db
      .select({
        totalShares: sql<number>`COUNT(*)`,
        totalViews: sql<number>`SUM(${showroomShares.views})`,
        activeShares: sql<number>`SUM(CASE WHEN ${showroomShares.isActive} = 1 THEN 1 ELSE 0 END)`,
        recentShares: sql<number>`SUM(CASE WHEN ${showroomShares.createdAt} >= ${sevenDaysAgo} THEN 1 ELSE 0 END)`,
      })
      .from(showroomShares)
      .where(eq(showroomShares.tenantId, tenantId));

    return {
      success: true,
      data: {
        /** 总分享次数 */
        totalShares: Number(aggregated[0]?.totalShares || 0),
        /** 总浏览量 (含 Redis 缓存未持久化部分) */
        totalViews: Number(aggregated[0]?.totalViews || 0),
        /** 当前活跃(未停用)的分享数 */
        activeShares: Number(aggregated[0]?.activeShares || 0),
        /** 过去 7 天新增的分享数 */
        recentNewShares: Number(aggregated[0]?.recentShares || 0),
      },
    };
  } catch (err) {
    logger.error('获取分享大盘统计失败', { error: err as Error });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}
