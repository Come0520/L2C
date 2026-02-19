'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { eq, desc, and, ilike } from 'drizzle-orm';
import { afterSalesTickets, orders } from '@/shared/api/schema';
import { afterSalesStatusEnum } from '@/shared/api/schema/enums';
import { auth } from '@/shared/lib/auth';
import { generateTicketNo, escapeLikePattern, maskPhoneNumber } from '../utils';
import { isValidTransition } from '../logic/state-machine';
import { AuditService } from '@/shared/lib/audit-service';
import { createTicketSchema, updateStatusSchema, _placeholderSchema } from './schemas';


/**
 * 分页获取售后工单列表
 * 包含租户隔离、状态过滤和工单号模糊搜索。
 * @param params { page, pageSize, status, search } 分页和过滤参数
 * @returns 包含工单列表的成功响应
 */
export async function getAfterSalesTickets(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
}) {
    // 安全校验：认证和租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }
    const tenantId = session.user.tenantId;

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const conditions = [
        eq(afterSalesTickets.tenantId, tenantId), // 租户隔离
    ];
    if (params?.status) {
        conditions.push(eq(afterSalesTickets.status, params.status as (typeof afterSalesStatusEnum.enumValues)[number]));
    }
    if (params?.search) {
        const safeSearch = escapeLikePattern(params.search);
        conditions.push(ilike(afterSalesTickets.ticketNo, `%${safeSearch}%`));
    }

    const data = await db.query.afterSalesTickets.findMany({
        where: and(...conditions),
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

    // P1 FIX (AS-15): 列表页手机号脱敏
    const safeData = data.map(ticket => ({
        ...ticket,
        customer: ticket.customer ? {
            ...ticket.customer,
            phone: maskPhoneNumber(ticket.customer.phone),
            phoneSecondary: maskPhoneNumber(ticket.customer.phoneSecondary),
        } : null,
    }));

    return { success: true, data: safeData };
}

/**
 * 创建售后工单 (Server Action)
 * 执行订单所属权验证、工单号生成及审计记录。
 */
const createAfterSalesTicketAction = createSafeAction(createTicketSchema, async (data, ctx) => {
    try {
        const newTicket = await db.transaction(async (tx) => {
            // P0 FIX (AS-01): 添加租户隔离，防止跨租户工单注入
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, data.orderId),
                    eq(orders.tenantId, ctx.session.user.tenantId) // 租户隔离校验
                ),
                columns: { id: true, tenantId: true, customerId: true, orderNo: true }
            });

            if (!order) {
                throw new Error("关联订单不存在或无权操作");
            }

            // P1 FIX (R2-05): 透传事务 tx 确保并发安全
            const ticketNo = await generateTicketNo(ctx.session.user.tenantId, tx);

            const userId = ctx.session?.user?.id;
            if (!userId) throw new Error("用户未登录");

            const [inserted] = await tx.insert(afterSalesTickets).values({
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

            return inserted;
        });

        // 记录审计日志
        await AuditService.recordFromSession(ctx.session, 'after_sales_tickets', newTicket.id, 'CREATE', {
            new: newTicket as Record<string, unknown>,
        });

        revalidatePath('/after-sales');
        return { success: true, data: newTicket, message: "售后工单创建成功" };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "服务器内部错误";
        console.error('[After Sales] Create Ticket Failed:', err); // 强化日志上下文
        return { success: false, message };
    }
});

/**
 * 创建售后工单
 * @param data 工单基本信息
 */
export async function createAfterSalesTicket(data: z.infer<typeof createTicketSchema>) {
    return createAfterSalesTicketAction(data);
}

/**
 * 获取工单详情 (Server Action)
 * 包含关联的客户、订单、责任单及处理记录。
 */
const getAfterSalesTicketDetailAction = createSafeAction(z.object({ id: z.string().uuid() }), async ({ id }, { session }) => {
    const tenantId = session.user.tenantId;

    const ticket = await db.query.afterSalesTickets.findFirst({
        where: and(
            eq(afterSalesTickets.id, id),
            eq(afterSalesTickets.tenantId, tenantId) // 租户隔离
        ),
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
            installTask: true,
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

    if (!ticket) return { success: false, message: '工单不存在' };

    // P1 FIX (AS-15): 详情页手机号脱敏
    if (ticket.customer) {
        // Create a new customer object to avoid mutating the original if it were cached/readonly
        // explicit assignment to satisfy type checker if necessary, or just mutation if it's a plain object.
        // Drizzle return types are mutable plain objects.
        ticket.customer.phone = maskPhoneNumber(ticket.customer.phone);
        ticket.customer.phoneSecondary = maskPhoneNumber(ticket.customer.phoneSecondary);
    }

    return { success: true, data: ticket };
});

/**
 * 根据 ID 获取工单详情
 */
export async function getTicketDetail(ticketId: string) {
    return getAfterSalesTicketDetailAction({ id: ticketId });
}

/**
 * 更新工单状态 (Server Action)
 * 核心逻辑：基于状态机的流转校验，并记录审计日志。
 */
const updateTicketStatusAction = createSafeAction(updateStatusSchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;

    // 安全校验：确保工单属于当前租户
    const ticket = await db.query.afterSalesTickets.findFirst({
        where: and(
            eq(afterSalesTickets.id, data.ticketId),
            eq(afterSalesTickets.tenantId, tenantId)
        ),
        columns: { id: true, status: true }
    });

    if (!ticket) {
        return { success: false, message: '工单不存在或无权操作' };
    }

    // P1 FIX (AS-07): 状态流转校验
    if (!isValidTransition(ticket.status, data.status)) {
        return {
            success: false,
            message: `无法从 ${ticket.status} 状态变更为 ${data.status}`
        };
    }

    await db.update(afterSalesTickets)
        .set({
            status: data.status,
            resolution: data.resolution,
            updatedAt: new Date(),
        })
        .where(and(
            eq(afterSalesTickets.id, data.ticketId),
            eq(afterSalesTickets.tenantId, tenantId) // P0 FIX (R2-01): 强制租户隔离
        ));

    // 记录审计日志
    await AuditService.recordFromSession(session, 'after_sales_tickets', data.ticketId, 'UPDATE', {
        old: { status: ticket.status },
        new: { status: data.status, resolution: data.resolution },
        changed: { status: data.status }
    });

    revalidatePath(`/after-sales/${data.ticketId}`);
    revalidatePath('/after-sales');
    return { success: true, message: '状态更新成功' };
});

/**
 * 手动更新工单状态及处理方案
 */
export async function updateTicketStatus(data: z.infer<typeof updateStatusSchema>) {
    return updateTicketStatusAction(data);
}

// ------------------------------------------------------------
// 占位功能 Actions
// ------------------------------------------------------------

const closeResolutionCostClosureAction = createSafeAction(_placeholderSchema, async () => {
    return { success: false, message: "功能开发中：结算单核销尚未开放" };
});
export async function closeResolutionCostClosure(_data: z.infer<typeof _placeholderSchema>) {
    return closeResolutionCostClosureAction(_data);
}

const checkTicketFinancialClosureAction = createSafeAction(_placeholderSchema, async () => {
    return { success: false, message: "功能开发中：财务关单校验尚未开放" };
});
export async function checkTicketFinancialClosure(_data: z.infer<typeof _placeholderSchema>) {
    return checkTicketFinancialClosureAction(_data);
}

const createExchangeOrderAction = createSafeAction(_placeholderSchema, async () => {
    return { success: false, message: "功能开发中：售后换货单生成尚未开放" };
});
export async function createExchangeOrder(_data: z.infer<typeof _placeholderSchema>) {
    return createExchangeOrderAction(_data);
}
