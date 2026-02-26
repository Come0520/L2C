'use server';

/**
 * 报价单房间 CRUD 操作
 * 包含：创建房间、更新房间、删除房间
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quoteRooms, quoteItems, quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createQuoteRoomSchema, updateQuoteRoomSchema } from './schema';
import { updateQuoteTotal } from './shared-helpers';
/**
 * 报价单房间 CRUD 操作 Actions
 * 处理空间信息的增删改，并同步触发报价单总额重新计算与缓存失效。
 */
import { AuditService } from '@/shared/lib/audit-service';
import { logger } from '@/shared/lib/logger';

// ─── 创建房间 ───────────────────────────────────

/**
 * 创建新房间 (Create Room)
 * 流程：校验报价单 -> 插入房间记录 -> 记录审计日志 -> 失效缓存。
 *
 * @param data - 包含报价单 ID、名称及可选测量空间 ID 的对象
 * @param context - 执行上下文
 * @returns 创建成功的房间记录
 */
export const createRoomActionInternal = createSafeAction(
  createQuoteRoomSchema,
  async (data, context) => {
    const tenantId = context.session.user.tenantId;
    if (!tenantId) throw new Error('未授权访问：缺少租户信息');
    logger.info('[quotes] 开始创建房间', { quoteId: data.quoteId, name: data.name });

    // 安全检查：验证报价单的租户归属
    const existingQuote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true },
    });
    if (!existingQuote) {
      logger.warn('报价单不存在或无权操作', { quoteId: data.quoteId, tenantId });
      throw new Error('报价单不存在或无权操作');
    }

    const [newRoom] = await db
      .insert(quoteRooms)
      .values({
        quoteId: data.quoteId,
        name: data.name,
        tenantId,
        measureRoomId: data.measureRoomId,
      })
      .returning();

    // 审计日志：记录报价单房间创建
    await AuditService.recordFromSession(context.session, 'quoteRooms', newRoom.id, 'CREATE', {
      new: { quoteId: newRoom.quoteId, name: newRoom.name },
    });

    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', {});
    logger.info('[quotes] 房间创建成功', { roomId: newRoom.id, quoteId: data.quoteId });
    return newRoom;
  }
);

/**
 * 客户端调用：在报价单中创建一个新房间 (Create Quote Room)
 * 场景：用户需要在报价单内按房间（如：主卧、客厅）组织行项目。
 *
 * @param params - 符合 createQuoteRoomSchema 的参数（quoteId, name 等）
 * @returns 创建的房间记录
 */
export async function createRoom(params: z.infer<typeof createQuoteRoomSchema>) {
  return createRoomActionInternal(params);
}

// ─── 更新房间 ───────────────────────────────────

/**
 * 更新房间信息 (Update Room)
 * 支持修改房间名称、测量空间关联等。
 *
 * @param data - 包含房间 ID 及更新字段的对象
 * @param context - 执行上下文
 * @returns 更新后的房间记录
 */
export const updateRoom = createSafeAction(updateQuoteRoomSchema, async (data, context) => {
  const { id, ...updateData } = data;
  const userTenantId = context.session.user.tenantId;
  logger.info('[quotes] 开始更新房间', { roomId: id });

  // 安全检查：验证房间属于当前租户
  const existing = await db.query.quoteRooms.findFirst({
    where: and(eq(quoteRooms.id, id), eq(quoteRooms.tenantId, userTenantId)),
  });
  if (!existing) {
    logger.warn('房间不存在或无权操作', { roomId: id, tenantId: userTenantId });
    throw new Error('房间不存在或无权操作');
  }

  const [updated] = await db
    .update(quoteRooms)
    .set({
      ...updateData,
    })
    .where(and(eq(quoteRooms.id, id), eq(quoteRooms.tenantId, userTenantId)))
    .returning();

  // 审计日志：记录报价单房间更新
  await AuditService.recordFromSession(context.session, 'quoteRooms', id, 'UPDATE', {
    old: { name: existing.name },
    new: { name: updated.name },
  });

  revalidatePath(`/quotes/${updated.quoteId}`);
  revalidateTag('quotes', {});
  logger.info('[quotes] 房间更新成功', { roomId: updated.id });
  return updated;
});

// ─── 删除房间 ───────────────────────────────────

/**
 * 删除房间 (Delete Room)
 * 注意：由于外键约束或业务逻辑，通常会先清空该房间下的所有行项目。
 * 流程：删除行项目 -> 删除房间 -> 重新计算总额 -> 记录审计 -> 失效缓存。
 *
 * @param data - 包含待删除房间 ID 的对象
 * @param context - 执行上下文
 * @returns 成功状态
 */
export const deleteRoom = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;
    logger.info('[quotes] 开始删除房间', { roomId: data.id });

    // 安全检查：验证房间属于当前租户
    const existing = await db.query.quoteRooms.findFirst({
      where: and(eq(quoteRooms.id, data.id), eq(quoteRooms.tenantId, userTenantId)),
    });
    if (!existing) {
      logger.warn('房间不存在或无权操作', { roomId: data.id, tenantId: userTenantId });
      throw new Error('房间不存在或无权操作');
    }

    // 先删除房间下的所有行项目
    await db
      .delete(quoteItems)
      .where(and(eq(quoteItems.roomId, data.id), eq(quoteItems.tenantId, userTenantId)));

    // 再删除房间
    await db
      .delete(quoteRooms)
      .where(and(eq(quoteRooms.id, data.id), eq(quoteRooms.tenantId, userTenantId)));

    // 重新计算报价单总额
    await updateQuoteTotal(existing.quoteId, userTenantId);

    // 审计日志：记录报价单房间删除
    await AuditService.recordFromSession(context.session, 'quoteRooms', data.id, 'DELETE', {
      old: { quoteId: existing.quoteId, name: existing.name },
    });

    revalidatePath(`/quotes/${existing.quoteId}`);
    revalidateTag('quotes', {});
    logger.info('[quotes] 房间删除成功', { roomId: data.id });
    return { success: true };
  }
);
