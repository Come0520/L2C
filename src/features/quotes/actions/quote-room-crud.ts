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
import { revalidatePath } from 'next/cache';
import { createQuoteRoomSchema, updateQuoteRoomSchema } from './schema';
import { updateQuoteTotal } from './shared-helpers';

// ─── 创建房间 ───────────────────────────────────

export const createRoomActionInternal = createSafeAction(
  createQuoteRoomSchema,
  async (data, context) => {
    const tenantId = context.session.user.tenantId;
    if (!tenantId) throw new Error('未授权访问：缺少租户信息');

    // 安全检查：验证报价单的租户归属
    const existingQuote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true }
    });
    if (!existingQuote) throw new Error('报价单不存在或无权操作');

    const [newRoom] = await db
      .insert(quoteRooms)
      .values({
        quoteId: data.quoteId,
        name: data.name,
        tenantId,
        measureRoomId: data.measureRoomId,
      })
      .returning();

    revalidatePath(`/quotes/${data.quoteId}`);
    return newRoom;
  }
);

export async function createRoom(params: z.infer<typeof createQuoteRoomSchema>) {
  return createRoomActionInternal(params);
}

// ─── 更新房间 ───────────────────────────────────

export const updateRoom = createSafeAction(updateQuoteRoomSchema, async (data, context) => {
  const { id, ...updateData } = data;
  const userTenantId = context.session.user.tenantId;

  // 安全检查：验证房间属于当前租户
  const existing = await db.query.quoteRooms.findFirst({
    where: and(eq(quoteRooms.id, id), eq(quoteRooms.tenantId, userTenantId)),
  });
  if (!existing) throw new Error('房间不存在或无权操作');

  const [updated] = await db
    .update(quoteRooms)
    .set({
      ...updateData,
    })
    .where(and(eq(quoteRooms.id, id), eq(quoteRooms.tenantId, userTenantId)))
    .returning();

  revalidatePath(`/quotes/${updated.quoteId}`);
  return updated;
});

// ─── 删除房间 ───────────────────────────────────

export const deleteRoom = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    // 安全检查：验证房间属于当前租户
    const existing = await db.query.quoteRooms.findFirst({
      where: and(eq(quoteRooms.id, data.id), eq(quoteRooms.tenantId, userTenantId)),
    });
    if (!existing) throw new Error('房间不存在或无权操作');

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

    revalidatePath(`/quotes/${existing.quoteId}`);
    return { success: true };
  }
);
