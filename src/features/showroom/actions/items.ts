'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { showroomItems } from '@/shared/api/schema/showroom';
import { eq, and, desc, sql, or, inArray } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { updateTag } from 'next/cache';
import {
  createShowroomItemSchema,
  updateShowroomItemSchema,
  deleteShowroomItemSchema,
  getShowroomItemsSchema,
} from './schema';
import { AuditService } from '@/shared/services/audit-service';
import { sanitizeContent } from './sanitize';
import { ShowroomError, ShowroomErrors } from '../errors';
import { calculateScore } from '../logic/scoring';
import { canManageShowroomItem } from '../logic/permissions';
import { redis } from '@/shared/lib/redis';
import { SQL } from 'drizzle-orm';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('ShowroomItemsAction');

/**
 * 云展厅素材管理 Actions
 */

/**
 * 分页获取展厅素材列表
 * 包含搜索、分类过滤和 0 状态过滤
 * @param input 查询参数
 */
export async function getShowroomItems(input: z.input<typeof getShowroomItemsSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  try {
    await checkPermission(session, PERMISSIONS.SHOWROOM.VIEW);
  } catch {
    throw new ShowroomError(ShowroomErrors.FORBIDDEN);
  }

  // __PLATFORM__ 是平台级租户，非普通商户，跳过数据库查询直接返回空列表
  // 防止无效 UUID 语法错误传递至 PostgreSQL
  if (session.user.tenantId === '__PLATFORM__') {
    return { data: [], pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 } };
  }

  const { page, pageSize, search, type, status, minScore, sortBy, categoryId } =
    getShowroomItemsSchema.parse(input);
  const offset = (page - 1) * pageSize;

  // 1. 缓存读取 (仅限非搜索查询)
  const versionKey = `showroom:items:${session.user.tenantId}:version`;
  let version = 0;

  if (redis) {
    try {
      version = (await redis.get<number>(versionKey)) || 0;
    } catch (err) {
      logger.warn('获取展厅版本缓存失败', { error: err });
    }
  }

  const cacheKey = `showroom:items:${session.user.tenantId}:v${version}:${JSON.stringify(input)}`;

  if (redis && !search) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached)
        return cached as {
          data: (typeof showroomItems.$inferSelect)[];
          pagination: { total: number; page: number; pageSize: number; totalPages: number };
        };
    } catch (err) {
      logger.warn('读取展厅缓存失败，降级为直连数据库', { error: err });
    }
  }

  // 2. 构造查询
  const whereConditions: (SQL | undefined)[] = [
    eq(showroomItems.tenantId, session.user.tenantId),
    eq(showroomItems.status, status ?? 'PUBLISHED'),
  ];

  if (search) {
    whereConditions.push(
      or(
        sql`${showroomItems.title} ILIKE ${`%${search}%`}`,
        sql`${showroomItems.tags}::text ILIKE ${`%${search}%`}`
      )
    );
  }

  if (type && (type as string) !== 'all') {
    whereConditions.push(eq(showroomItems.type, type));
  }

  if (minScore) {
    whereConditions.push(sql`${showroomItems.score} >= ${minScore}`);
  }

  if (categoryId) {
    // 如果存在分类要求，则必须借用表连接去判定 `product.category`，这是一个扩展点
    const { products } = await import('@/shared/api/schema/catalogs');
    whereConditions.push(
      inArray(
        showroomItems.productId,
        db
          .select({ id: products.id })
          .from(products)
          .where(sql`${products.category} = ${categoryId}`)
      )
    );
  }

  // 3. 排序策略
  let orderByCondition;
  if (sortBy === 'latest') {
    orderByCondition = desc(showroomItems.createdAt);
  } else if (sortBy === 'views') {
    orderByCondition = desc(showroomItems.views);
  } else {
    // default to score
    orderByCondition = desc(showroomItems.score);
  }

  // 4. 执行合并查询 (SQL 窗口函数优化)
  try {
    const result = await db
      .select({
        item: showroomItems,
        totalCount: sql<number>`count(*) OVER()`.mapWith(Number),
      })
      .from(showroomItems)
      .where(and(...whereConditions))
      .orderBy(orderByCondition, desc(showroomItems.createdAt))
      .limit(pageSize)
      .offset(offset);

    const data = result.map((r) => r.item);
    const total = result[0]?.totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);

    const response = {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };

    // 4. 写入缓存 (5分钟)
    if (redis && !search) {
      try {
        await redis.set(cacheKey, response, {
          ex: 300,
          // 标记该缓存属于展厅列表，方便未来扩展
          // [Note] 这里配合 `revalidateTag` 使用 Next.js 原生缓存层会更优雅，
          // 但为了保持现有 Redis 逻辑的一致性，我们先保留手动 Redis 写入。
        });
      } catch (err) {
        logger.warn('写入展厅列表缓存失败', { error: err });
      }
    }

    logger.info('获取展厅素材列表成功', { tenantId: session.user.tenantId, page, pageSize, total });

    return response;
  } catch (error) {
    logger.error('获取展厅素材列表失败', { error, input });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 获取单个展厅素材详情
 * @param id 素材 ID
 */
export async function getShowroomItemDetail(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  try {
    const item = await db.query.showroomItems.findFirst({
      where: and(eq(showroomItems.id, id), eq(showroomItems.tenantId, session.user.tenantId)),
      with: {
        product: true,
        creator: true,
      },
    });

    if (!item) {
      logger.error('未找到指定的展厅素材', { id, tenantId: session.user.tenantId });
      throw new ShowroomError(ShowroomErrors.ITEM_NOT_FOUND);
    }

    logger.info('获取展厅素材详情成功', { id, tenantId: session.user.tenantId });
    return item;
  } catch (error) {
    if (error instanceof ShowroomError) throw error;
    logger.error('获取展厅素材详情失败', { error, id });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 创建新的展厅素材
 * 自动计算内容得分并记录审计日志
 * @param input 创建参数
 */
export async function createShowroomItem(input: z.input<typeof createShowroomItemSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  const data = createShowroomItemSchema.parse(input);

  // XSS 防御（使用纯函数清洗，无 jsdom 依赖）
  if (data.content) {
    data.content = sanitizeContent(data.content);
  }

  const score = calculateScore(data);

  try {
    const newItem = await db.transaction(async (tx) => {
      const [insertedItem] = await tx.insert(showroomItems)
        .values({
          ...data,
          tenantId: session.user.tenantId,
          createdBy: session.user.id,
          score: score,
        })
        .returning();
      await AuditService.log(tx, {
        tableName: 'showroom_items',
        recordId: insertedItem.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: insertedItem as Record<string, unknown>,
      });
      return insertedItem;
    });
    // 记录审计日志
    await invalidateShowroomCache(session.user.tenantId);

    logger.info('创建展厅素材成功', {
      itemId: newItem.id,
      tenantId: session.user.tenantId,
      createdBy: session.user.id,
    });

    return newItem;
  } catch (error) {
    logger.error('创建展厅素材失败', { error, input });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 更新展厅素材
 * 仅限创建者或管理员，自动更新得分
 * @param input 更新参数
 */
export async function updateShowroomItem(input: z.input<typeof updateShowroomItemSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  const { id, ...data } = updateShowroomItemSchema.parse(input);

  // XSS 防御：尽早清洗（使用纯函数清洗，无 jsdom 依赖）
  if (data.content) {
    data.content = sanitizeContent(data.content);
  }

  const existing = await db.query.showroomItems.findFirst({
    where: and(eq(showroomItems.id, id), eq(showroomItems.tenantId, session.user.tenantId)),
  });

  if (!existing) throw new ShowroomError(ShowroomErrors.ITEM_NOT_FOUND);

  // 权限检查
  const canManage = await canManageShowroomItem(session, existing.createdBy ?? '');
  if (!canManage) {
    throw new ShowroomError(ShowroomErrors.FORBIDDEN);
  }

  const mergedData = {
    ...existing,
    ...data,
    images: (data.images ?? existing.images) as string[],
    tags: (data.tags ?? existing.tags) as string[],
    productId: (data.productId ?? existing.productId) as string | undefined,
    content: (data.content ?? existing.content) as string | undefined,
  };

  const score = calculateScore(mergedData);

  try {
    const updatedItem = await db.transaction(async (tx) => {
      const [patchedItem] = await tx.update(showroomItems)
        .set({
          ...data,
          score,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(and(eq(showroomItems.id, id), eq(showroomItems.tenantId, session.user.tenantId)))
        .returning();
      await AuditService.log(tx, {
        tableName: 'showroom_items',
        recordId: id,
        action: 'UPDATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: existing as Record<string, unknown>,
        newValues: patchedItem as Record<string, unknown>,
      });
      return patchedItem;
    });
    updateTag(`showroom-item-${id}`);
    await invalidateShowroomCache(session.user.tenantId);

    logger.info('更新展厅素材成功', {
      itemId: id,
      tenantId: session.user.tenantId,
      updatedBy: session.user.id,
    });

    return updatedItem;
  } catch (error) {
    logger.error('更新展厅素材失败', { error, input });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 逻辑删除展厅素材 (软删除)
 * 将状态更改为 ARCHIVED
 * @param id 素材 ID
 */
export async function deleteShowroomItem(input: z.input<typeof deleteShowroomItemSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new ShowroomError(ShowroomErrors.UNAUTHORIZED);

  const { id } = deleteShowroomItemSchema.parse(input);

  const existing = await db.query.showroomItems.findFirst({
    where: and(eq(showroomItems.id, id), eq(showroomItems.tenantId, session.user.tenantId)),
  });

  if (!existing) throw new ShowroomError(ShowroomErrors.ITEM_NOT_FOUND);

  const canManage = await canManageShowroomItem(session, existing.createdBy ?? '');
  if (!canManage) {
    throw new ShowroomError(ShowroomErrors.FORBIDDEN);
  }

  try {
    await db.transaction(async (tx) => {
      await tx.update(showroomItems)
        .set({ status: 'ARCHIVED', updatedAt: new Date(), updatedBy: session.user.id })
        .where(and(eq(showroomItems.id, id), eq(showroomItems.tenantId, session.user.tenantId)));
      await AuditService.log(tx, {
        tableName: 'showroom_items',
        recordId: id,
        action: 'DELETE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: existing as Record<string, unknown>,
      });
    });
    updateTag(`showroom-item-${id}`);
    await invalidateShowroomCache(session.user.tenantId);

    logger.info('软删除展厅素材成功', {
      itemId: id,
      tenantId: session.user.tenantId,
      deletedBy: session.user.id,
    });

    return { success: true };
  } catch (error) {
    logger.error('软删除展厅素材失败', { error, input });
    throw new ShowroomError(ShowroomErrors.INTERNAL_ERROR);
  }
}

/**
 * 失效租户的展厅缓存 (通过增加版本号)
 */
async function invalidateShowroomCache(tenantId: string) {
  if (redis) {
    try {
      await redis.incr(`showroom:items:${tenantId}:version`);
    } catch (err) {
      logger.warn('失效展厅缓存缓存版本号失败', { error: err });
    }
  }
}
