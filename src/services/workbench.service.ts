import { db } from "@/shared/api/db";
import { leads } from "@/shared/api/schema/leads";
import { orders } from "@/shared/api/schema/orders";
import { purchaseOrders, productionTasks } from "@/shared/api/schema/supply-chain";
import { afterSalesTickets } from "@/shared/api/schema/after-sales";
import { approvalTasks } from "@/shared/api/schema/approval";
import { eq, and, lt, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { users } from "@/shared/api/schema";
import { UserDashboardConfig } from "@/features/dashboard/types";
import { getDefaultDashboardConfig } from "@/features/dashboard/utils";
import { createLogger } from "@/shared/lib/logger";
import { WorkbenchError, WorkbenchErrors } from "@/features/dashboard/errors";

const logger = createLogger('WorkbenchService');

// ============ 待办事项类型定义 ============

/** 待办事项分类 */
export type TodoCategory = 'LEAD' | 'ORDER' | 'PO' | 'PRODUCTION' | 'AFTER_SALES' | 'APPROVAL';

/** 待办事项元数据（用于 Accordion 标题行） */
export interface TodoCategoryMeta {
    category: TodoCategory;
    label: string;
    count: number;
    icon: string;
    color: string;
}

/** 待跟进线索 */
export interface LeadTodoItem {
    id: string;
    leadNo: string;
    customerName: string;
    customerPhone: string;
    intentionLevel: string | null;
    status: string | null;
    createdAt: Date | null;
    lastActivityAt: Date | null;
}

/** 待处理订单 */
export interface OrderTodoItem {
    id: string;
    orderNo: string;
    customerName: string | null;
    totalAmount: string | null;
    status: string | null;
    isLocked: boolean | null;
    createdAt: Date | null;
}

/** 草稿采购单 */
export interface POTodoItem {
    id: string;
    poNo: string;
    supplierName: string | null;
    totalAmount: string | null;
    status: string | null;
    createdAt: Date | null;
}

/** 待处理生产任务 */
export interface ProductionTodoItem {
    id: string;
    taskNo: string;
    workshop: string | null;
    status: string | null;
    createdAt: Date | null;
}

/** 售后待办 */
export interface AfterSalesTodItem {
    id: string;
    ticketNo: string;
    type: string;
    priority: string | null;
    status: string | null;
    description: string | null;
    createdAt: Date;
}

/** 审批待办 */
export interface ApprovalTodoItem {
    id: string;
    approvalId: string;
    entityType: string | null;
    status: string | null;
    createdAt: Date | null;
    timeoutAt: Date | null;
}

/** 统一的待办响应 */
export interface TodosResponse {
    categories: TodoCategoryMeta[];
    leads: LeadTodoItem[];
    orders: OrderTodoItem[];
    purchaseOrders: POTodoItem[];
    productionTasks: ProductionTodoItem[];
    afterSales: AfterSalesTodItem[];
    approvalTodos: ApprovalTodoItem[];
}

// ============ 报警类型定义 ============

export type AlertSeverity = 'error' | 'warning' | 'info';
export type AlertCategory = 'SLA_OVERDUE' | 'LEAD_OVERDUE' | 'PAYMENT_OVERDUE' | 'DELIVERY_DELAY';

export interface AlertItem {
    id: string;
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    description: string;
    relatedId: string;
    relatedType: string;
    createdAt: Date | null;
}

export interface AlertCategoryMeta {
    category: AlertCategory;
    label: string;
    count: number;
    severity: AlertSeverity;
}

export interface AlertsResponse {
    categories: AlertCategoryMeta[];
    items: AlertItem[];
}

// ============ 服务实现 ============

export class WorkbenchService {

    /**
     * 获取当前用户的全部待办事项（含计数和详情数据）
     * L5 优化：增加数据缓存，有效期 1 分钟
     */
    static async getUnifiedTodos(
        tenantId: string,
        userId: string,
        userRoles: string[] = []
    ): Promise<TodosResponse> {
        logger.info('获取统一待办事项', { tenantId, userId });
        return unstable_cache(
            async () => {
                const isAdmin = userRoles.some(r =>
                    ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(r)
                );

                try {
                    // 并行查询所有分类，各子项异常不阻塞整体
                    const [
                        pendingLeads,
                        draftOrders,
                        draftPOs,
                        pendingPrd,
                        pendingAS,
                        pendingApprovals,
                    ] = await Promise.all([
                        // 1. 待跟进线索
                        db.query.leads.findMany({
                            where: and(
                                eq(leads.tenantId, tenantId),
                                ...(isAdmin ? [] : [eq(leads.assignedSalesId, userId)]),
                                eq(leads.status, 'PENDING_FOLLOWUP')
                            ),
                            columns: {
                                id: true, leadNo: true, customerName: true, customerPhone: true,
                                intentionLevel: true, status: true, createdAt: true, lastActivityAt: true,
                            },
                            limit: 50,
                        }).catch(e => {
                            logger.error('查询线索待办失败', { tenantId, userId, error: e });
                            return [];
                        }),

                        // 2. 未锁定订单
                        db.query.orders.findMany({
                            where: and(
                                eq(orders.tenantId, tenantId),
                                ...(isAdmin ? [] : [eq(orders.salesId, userId)]),
                                eq(orders.isLocked, false)
                            ),
                            columns: {
                                id: true, orderNo: true, customerName: true, totalAmount: true,
                                status: true, isLocked: true, createdAt: true,
                            },
                            limit: 50,
                        }).catch(e => {
                            logger.error('查询订单待办失败', { tenantId, userId, error: e });
                            return [];
                        }),

                        // 3. 草稿采购单
                        db.query.purchaseOrders.findMany({
                            where: and(
                                eq(purchaseOrders.tenantId, tenantId),
                                eq(purchaseOrders.status, 'DRAFT')
                            ),
                            columns: {
                                id: true, poNo: true, supplierName: true, totalAmount: true,
                                status: true, createdAt: true,
                            },
                            limit: 50,
                        }).catch(e => {
                            logger.error('查询采购单待办失败', { tenantId, error: e });
                            return [];
                        }),

                        // 4. 待处理生产任务
                        db.query.productionTasks.findMany({
                            where: and(
                                eq(productionTasks.tenantId, tenantId),
                                eq(productionTasks.status, 'PENDING')
                            ),
                            columns: {
                                id: true, taskNo: true, workshop: true, status: true, createdAt: true,
                            },
                            limit: 50,
                        }).catch(e => {
                            logger.error('查询生产任务失败', { tenantId, error: e });
                            return [];
                        }),

                        // 5. 待处理售后工单
                        db.query.afterSalesTickets.findMany({
                            where: and(
                                eq(afterSalesTickets.tenantId, tenantId),
                                eq(afterSalesTickets.status, 'PENDING')
                            ),
                            columns: {
                                id: true, ticketNo: true, type: true, priority: true,
                                status: true, description: true, createdAt: true,
                            },
                            limit: 50,
                        }).catch(e => {
                            logger.error('查询售后工单失败', { tenantId, error: e });
                            return [];
                        }),

                        // 6. 待审批任务（按当前用户过滤）
                        db.query.approvalTasks.findMany({
                            where: and(
                                eq(approvalTasks.tenantId, tenantId),
                                eq(approvalTasks.approverId, userId),
                                eq(approvalTasks.status, 'PENDING')
                            ),
                            columns: {
                                id: true, approvalId: true, status: true,
                                createdAt: true, timeoutAt: true,
                            },
                            with: {
                                approval: {
                                    columns: { entityType: true },
                                },
                            },
                            limit: 50,
                        }).catch(e => {
                            logger.error('查询审批待办失败', { tenantId, userId, error: e });
                            return [];
                        }),
                    ]);

                    // 将关联查询的 entityType 提取到顶层
                    const normalizedApprovals: ApprovalTodoItem[] = (pendingApprovals as any[]).map(t => ({
                        id: t.id,
                        approvalId: t.approvalId,
                        entityType: t.approval?.entityType ?? null,
                        status: t.status,
                        createdAt: t.createdAt,
                        timeoutAt: t.timeoutAt,
                    }));

                    const categories: TodoCategoryMeta[] = [
                        { category: 'LEAD', label: '待跟进线索', count: pendingLeads.length, icon: 'Users', color: 'blue' },
                        { category: 'ORDER', label: '待处理订单', count: draftOrders.length, icon: 'ShoppingCart', color: 'amber' },
                        { category: 'PO', label: '草稿采购单', count: draftPOs.length, icon: 'Clipboard', color: 'purple' },
                        { category: 'PRODUCTION', label: '待处理生产', count: pendingPrd.length, icon: 'Factory', color: 'cyan' },
                        { category: 'AFTER_SALES', label: '售后工单', count: pendingAS.length, icon: 'Wrench', color: 'emerald' },
                        { category: 'APPROVAL', label: '待审批', count: normalizedApprovals.length, icon: 'ClipboardCheck', color: 'orange' },
                    ];

                    return {
                        categories,
                        leads: pendingLeads as LeadTodoItem[],
                        orders: draftOrders as OrderTodoItem[],
                        purchaseOrders: draftPOs as POTodoItem[],
                        productionTasks: pendingPrd as ProductionTodoItem[],
                        afterSales: pendingAS as AfterSalesTodItem[],
                        approvalTodos: normalizedApprovals,
                    };
                } catch (error) {
                    throw new WorkbenchError(WorkbenchErrors.FETCH_TODOS_FAILED, { tenantId, userId, error });
                }
            },
            [`todos-${tenantId}-${userId}-${[...userRoles].sort().join(',')}`],
            { revalidate: 60, tags: [`todos:${tenantId}`, `todos:${userId}`] }
        )();
    }

    /**
     * 获取报警数据
     */
    static async getAlerts(tenantId: string): Promise<AlertsResponse> {
        logger.info('获取工作台报警信息', { tenantId });
        return unstable_cache(
            async () => {
                const now = new Date();
                const items: AlertItem[] = [];
                const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

                try {
                    const [overdueLeads, slaOverdueTickets, delayedPOs] = await Promise.all([
                        db.query.leads.findMany({
                            where: and(eq(leads.tenantId, tenantId), eq(leads.status, 'PENDING_FOLLOWUP'), lt(leads.createdAt, twoDaysAgo)),
                            columns: { id: true, leadNo: true, customerName: true, createdAt: true },
                            limit: 20,
                        }).catch(e => {
                            logger.error('查询线索报警失败', { tenantId, error: e });
                            return [];
                        }),
                        db.query.afterSalesTickets.findMany({
                            where: and(eq(afterSalesTickets.tenantId, tenantId), eq(afterSalesTickets.status, 'PENDING'), lt(afterSalesTickets.slaResponseDeadline, now)),
                            columns: { id: true, ticketNo: true, type: true, slaResponseDeadline: true, createdAt: true },
                            limit: 20,
                        }).catch(e => {
                            logger.error('查询 SLA 报警失败', { tenantId, error: e });
                            return [];
                        }),
                        db.query.purchaseOrders.findMany({
                            where: and(eq(purchaseOrders.tenantId, tenantId), inArray(purchaseOrders.status, ['IN_PRODUCTION', 'READY', 'SHIPPED', 'PENDING_PAYMENT']), lt(purchaseOrders.expectedDate, now)),
                            columns: { id: true, poNo: true, supplierName: true, expectedDate: true, createdAt: true },
                            limit: 20,
                        }).catch(e => {
                            logger.error('查询采购延迟报警失败', { tenantId, error: e });
                            return [];
                        })
                    ]);

                    overdueLeads.forEach(l => {
                        items.push({
                            id: `alert-lead-${l.id}`, category: 'LEAD_OVERDUE', severity: 'warning',
                            title: `线索 ${l.leadNo} 跟进超时`, description: `客户 ${l.customerName} 的线索超过 48 小时未跟进`,
                            relatedId: l.id, relatedType: 'LEAD', createdAt: l.createdAt,
                        });
                    });

                    slaOverdueTickets.forEach(t => {
                        items.push({
                            id: `alert-sla-${t.id}`, category: 'SLA_OVERDUE', severity: 'error',
                            title: `售后工单 ${t.ticketNo} SLA 超时`, description: `工单类型: ${t.type}，已超过 SLA 响应期限`,
                            relatedId: t.id, relatedType: 'AFTER_SALES', createdAt: t.createdAt,
                        });
                    });

                    delayedPOs.forEach(po => {
                        items.push({
                            id: `alert-delivery-${po.id}`, category: 'DELIVERY_DELAY', severity: 'warning',
                            title: `采购单 ${po.poNo} 交货延迟`, description: `供应商: ${po.supplierName || '未知'}，已超过预计交货时间`,
                            relatedId: po.id, relatedType: 'PO', createdAt: po.createdAt,
                        });
                    });

                    const categoryMap = new Map<AlertCategory, AlertCategoryMeta>();
                    items.forEach(item => {
                        const existing = categoryMap.get(item.category);
                        if (existing) {
                            existing.count++;
                        } else {
                            const labelMap: Record<AlertCategory, string> = {
                                LEAD_OVERDUE: '线索跟进超时',
                                SLA_OVERDUE: 'SLA 响应超时',
                                DELIVERY_DELAY: '交货延迟',
                                PAYMENT_OVERDUE: '付款逾期',
                            };
                            categoryMap.set(item.category, {
                                category: item.category, label: labelMap[item.category],
                                count: 1, severity: item.severity,
                            });
                        }
                    });

                    return { categories: Array.from(categoryMap.values()), items };
                } catch (error) {
                    throw new WorkbenchError(WorkbenchErrors.FETCH_ALERTS_FAILED, { tenantId, error });
                }
            },
            [`alerts-${tenantId}`],
            { revalidate: 60, tags: [`alerts:${tenantId}`] }
        )();
    }

    /**
     * 获取仪表盘配置（带缓存）
     */
    static async getDashboardConfig(userId: string, role: string): Promise<UserDashboardConfig> {
        return unstable_cache(
            async () => {
                const user = await db.query.users.findFirst({
                    where: eq(users.id, userId),
                    columns: { dashboardConfig: true }
                });

                if (user?.dashboardConfig && typeof user.dashboardConfig === 'object') {
                    return user.dashboardConfig as unknown as UserDashboardConfig;
                }
                return getDefaultDashboardConfig(role);
            },
            [`dashboard-config-${userId}`],
            { revalidate: 3600, tags: [`dashboard-config:${userId}`] }
        )();
    }

    /**
     * 更新仪表盘配置
     */
    static async updateDashboardConfig(userId: string, config: UserDashboardConfig): Promise<void> {
        await db.update(users)
            .set({
                dashboardConfig: config as any,
                updatedAt: new Date()
            })
            .where(eq(users.id, userId));
    }
}
