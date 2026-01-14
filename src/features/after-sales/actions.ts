'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { afterSalesTickets, liabilityNotices, orders } from '@/shared/api/schema';
import { eq, desc, and, ilike } from 'drizzle-orm';
import { afterSalesStatusEnum, liablePartyTypeEnum, liabilityReasonCategoryEnum } from '@/shared/api/schema/enums';

// Schema Definitions
const createTicketSchema = z.object({
    orderId: z.string().uuid(),
    type: z.string(), // REPAIR, RETURN, COMPLAINT
    description: z.string().min(1, "问题描述不能为空"),
    photos: z.array(z.string()).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    assignedTo: z.string().uuid().optional(),
});

const updateStatusSchema = z.object({
    ticketId: z.string().uuid(),
    status: z.enum(afterSalesStatusEnum.enumValues),
    resolution: z.string().optional(),
});

/**
 * 获取售后工单列表
 * @param params 查询参数 (分页, 状态, 搜索)
 */
export const getAfterSalesTickets = async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
}) => {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (params?.status) {
        // Safe cast as we expect the caller to pass valid status or we can validate it.
        // Drizzle might expect specific enum type.
        conditions.push(eq(afterSalesTickets.status, params.status as (typeof afterSalesStatusEnum.enumValues)[number]));
    }
    // Search by ticketNo or customer name (need join for customer name if not denormalized enough, schema says customerId is there)
    // For simplicity, search ticketNo for now.
    if (params?.search) {
        conditions.push(ilike(afterSalesTickets.ticketNo, `%${params.search}%`));
    }

    const data = await db.query.afterSalesTickets.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        limit: pageSize,
        offset: offset,
        orderBy: [desc(afterSalesTickets.createdAt)],
        with: {
            customer: true,
            order: true,
            assignee: true,
            creator: true,
        }
    });

    return { success: true, data };
};

/**
 * 创建售后工单
 */
export const createAfterSalesTicket = createSafeAction(createTicketSchema, async (data, ctx) => {
    return await db.transaction(async (tx) => {
        // Fetch order to get customerId and tenantId
        const order = await tx.query.orders.findFirst({
            where: eq(orders.id, data.orderId),
            columns: { id: true, tenantId: true, customerId: true, orderNo: true }
        });

        if (!order) {
            return { success: false, message: "关联订单不存在" };
        }

        // Generate Ticket No (Simple logic for demo: AS + Timestamp)
        const ticketNo = `AS${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;

        const userId = ctx.session?.user?.id;
        if (!userId) return { success: false, message: "用户未登录" };

        const [newTicket] = await tx.insert(afterSalesTickets).values({
            tenantId: order.tenantId,
            ticketNo: ticketNo,
            orderId: order.id,
            customerId: order.customerId,
            type: data.type,
            description: data.description,
            photos: data.photos,
            priority: data.priority,
            assignedTo: data.assignedTo,
            createdBy: userId,
            status: 'PENDING',
        }).returning();

        revalidatePath('/after-sales');
        return { success: true, data: newTicket, message: "售后工单创建成功" };
    });
});

/**
 * 获取工单详情
 */
export const getTicketDetail = async (ticketId: string) => {
    const ticket = await db.query.afterSalesTickets.findFirst({
        where: eq(afterSalesTickets.id, ticketId),
        with: {
            customer: true,
            order: {
                with: {
                    installTasks: true,
                    purchaseOrders: true,
                }
            },
            assignee: true,
            creator: true,
            installTask: true, // Ticket linked install task
            notices: {
                with: {
                    confirmer: true,
                    sourcePurchaseOrder: true,
                    sourceInstallTask: true,
                },
                orderBy: (notices, { desc }) => [desc(notices.createdAt)],
            }
        }
    });

    if (!ticket) return { success: false, message: "工单不存在" };
    return { success: true, data: ticket };
};

/**
 * 更新工单状态
 */
export const updateTicketStatus = createSafeAction(updateStatusSchema, async (data) => {
    await db.update(afterSalesTickets)
        .set({
            status: data.status,
            resolution: data.resolution,
            updatedAt: new Date(),
        })
        .where(eq(afterSalesTickets.id, data.ticketId));

    revalidatePath(`/after-sales/${data.ticketId}`);
    revalidatePath('/after-sales');
    return { success: true, message: "状态更新成功" };
});

// Liability Notice Schemas
const createLiabilitySchema = z.object({
    afterSalesId: z.string().uuid(),
    liablePartyType: z.enum(liablePartyTypeEnum.enumValues),
    liablePartyId: z.string().uuid().optional(),
    reason: z.string().min(1, "定责原因描述不能为空"),
    liabilityReasonCategory: z.enum(liabilityReasonCategoryEnum.enumValues).optional(), // Added
    amount: z.coerce.number().min(0, "金额必须大于等于0"),
    evidencePhotos: z.array(z.string()).optional(),

    // Traceability (Optional)
    sourcePurchaseOrderId: z.string().uuid().optional(),
    sourceInstallTaskId: z.string().uuid().optional(),
});

const confirmLiabilitySchema = z.object({
    noticeId: z.string().uuid(),
});

/**
 * 创建定责单
 */
export const createLiabilityNotice = createSafeAction(createLiabilitySchema, async (data, ctx) => {
    return await db.transaction(async (tx) => {
        // Validation: Check if AFTER_SALES exists (omitted for brevity, can depend on FK constraint or explicit check)
        const ticket = await tx.query.afterSalesTickets.findFirst({
            where: eq(afterSalesTickets.id, data.afterSalesId),
            columns: { id: true, tenantId: true, ticketNo: true }
        });

        if (!ticket) return { success: false, message: "关联工单不存在" };

        const noticeNo = `LN${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;

        const [notice] = await tx.insert(liabilityNotices).values({
            tenantId: ticket.tenantId,
            noticeNo: noticeNo,
            afterSalesId: ticket.id,
            liablePartyType: data.liablePartyType,
            liablePartyId: data.liablePartyId,
            reason: data.reason,
            liabilityReasonCategory: data.liabilityReasonCategory, // Added
            amount: data.amount.toString(),
            evidencePhotos: data.evidencePhotos,
            sourcePurchaseOrderId: data.sourcePurchaseOrderId, // Added
            sourceInstallTaskId: data.sourceInstallTaskId, // Added
            status: 'DRAFT',
        }).returning();

        revalidatePath(`/after-sales/${ticket.id}`);
        return { success: true, data: notice, message: "定责单创建成功" };
    });
});

/**
 * 确认定责单
 */
export const confirmLiabilityNotice = createSafeAction(confirmLiabilitySchema, async (data, ctx) => {
    return await db.transaction(async (tx) => {
        const notice = await tx.query.liabilityNotices.findFirst({
            where: eq(liabilityNotices.id, data.noticeId),
        });

        if (!notice) return { success: false, message: "定责单不存在" };
        if (notice.status === 'CONFIRMED') return { success: false, message: "定责单已确认" };

        const userId = ctx.session?.user?.id;
        if (!userId) return { success: false, message: "用户未登录" };

        await tx.update(liabilityNotices).set({
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            confirmedBy: userId,
            updatedAt: new Date(),
        }).where(eq(liabilityNotices.id, data.noticeId));

        // Recalculate Ticket's actual deduction
        const allNotices = await tx.query.liabilityNotices.findMany({
            where: eq(liabilityNotices.afterSalesId, notice.afterSalesId),
        });

        const totalDeduction = allNotices
            .filter(n => n.status === 'CONFIRMED')
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        await tx.update(afterSalesTickets)
            .set({
                actualDeduction: totalDeduction.toString(),
                updatedAt: new Date(),
            })
            .where(eq(afterSalesTickets.id, notice.afterSalesId));

        revalidatePath(`/after-sales/${notice.afterSalesId}`);
        return { success: true, message: "定责单已确认，工单扣款金额已更新" };
    });
});


// Placeholder exports to match previous file exports if needed, or remove them
export const closeResolutionCostClosure = createSafeAction(z.any(), async () => ({ success: true }));
export const checkTicketFinancialClosure = createSafeAction(z.any(), async () => ({ success: true }));
export const createExchangeOrder = createSafeAction(z.any(), async () => ({ success: true }));
