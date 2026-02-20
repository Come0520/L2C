'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/shared/api/db';
import { eq, desc, and, ilike } from 'drizzle-orm';
import { afterSalesTickets, orders, auditLogs, liabilityNotices } from '@/shared/api/schema';
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
    type?: string;
    priority?: string;
    isWarranty?: string;
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
    if (params?.type && params.type !== 'all') {
        conditions.push(eq(afterSalesTickets.type, params.type));
    }
    if (params?.priority && params.priority !== 'all') {
        conditions.push(eq(afterSalesTickets.priority, params.priority));
    }
    if (params?.isWarranty !== undefined && params.isWarranty !== 'all') {
        conditions.push(eq(afterSalesTickets.isWarranty, params.isWarranty === 'true'));
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
        revalidateTag('after-sales-analytics');
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
    revalidateTag('after-sales-analytics');
    return { success: true, message: '状态更新成功' };
});

/**
 * 手动更新工单状态及处理方案
 */
export async function updateTicketStatus(data: z.infer<typeof updateStatusSchema>) {
    return updateTicketStatusAction(data);
}

/**
 * 获取工单的审计日志 (用于时间轴展示)
 */
export async function getTicketLogs(ticketId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, message: '未授权' };

    const logs = await db.query.auditLogs.findMany({
        where: and(
            eq(auditLogs.tableName, 'after_sales_tickets'),
            eq(auditLogs.recordId, ticketId),
            eq(auditLogs.tenantId, session.user.tenantId)
        ),
        with: {
            user: true
        },
        orderBy: [desc(auditLogs.createdAt)]
    });

    return { success: true, data: logs };
}

/**
 * 售后成本结案
 * 计算最终内部损失并存档。
 */
export async function closeResolutionCostClosure(ticketId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    const ticket = await db.query.afterSalesTickets.findFirst({
        where: eq(afterSalesTickets.id, ticketId)
    });

    if (!ticket) return { success: false, error: '工单不存在' };

    const actualCost = Number(ticket.totalActualCost || 0);
    const actualDeduction = Number(ticket.actualDeduction || 0);
    const internalLoss = actualCost - actualDeduction;

    await db.update(afterSalesTickets)
        .set({
            internalLoss: internalLoss.toString(),
            status: 'CLOSED',
            closedAt: new Date(),
            updatedAt: new Date()
        })
        .where(eq(afterSalesTickets.id, ticketId));

    await AuditService.record({
        tableName: 'after_sales_tickets',
        recordId: ticketId,
        action: 'CLOSE_COST',
        changes: { internalLoss: internalLoss.toString(), status: 'CLOSED' },
        userId: session.user.id
    });

    revalidateTag(`after-sales-ticket-${ticketId}`);
    return { success: true, message: '成本结案成功' };
}

/**
 * 校验工单财务结案状态
 * 检查所有关联定责单是否已财务同步。
 */
export async function checkTicketFinancialClosure(ticketId: string) {
    const notices = await db.query.liabilityNotices.findMany({
        where: eq(liabilityNotices.afterSalesId, ticketId)
    });

    if (notices.length === 0) {
        return { success: true, isClosed: true, message: '无定责单，自动通过' };
    }

    const unclosedNotices = notices.filter(n => n.financeStatus !== 'SYNCED');

    if (unclosedNotices.length > 0) {
        return {
            success: true,
            isClosed: false,
            message: `仍有 ${unclosedNotices.length} 份定责单未完成财务同步`
        };
    }

    return { success: true, isClosed: true, message: '所有财务流程已闭环' };
}

/**
 * 创建换货订单 (占位实现)
 * 基于售后工单生成一个换货类型的销售订单。
 */
export async function createExchangeOrder(ticketId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    const ticket = await db.query.afterSalesTickets.findFirst({
        where: eq(afterSalesTickets.id, ticketId),
        with: { order: true }
    });

    if (!ticket) return { success: false, error: '工单不存在' };

    // 这里仅作为演示：创建一个关联原订单的草稿订单
    const newOrderNo = `EX${Date.now()}`;

    return {
        success: true,
        message: `换货订单 ${newOrderNo} 已生成 (草稿)`,
        data: { orderNo: newOrderNo }
    };
}

