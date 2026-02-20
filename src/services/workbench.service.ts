import { db } from "@/shared/api/db";
import { leads } from "@/shared/api/schema/leads";
import { orders } from "@/shared/api/schema/orders";
import { purchaseOrders, productionTasks } from "@/shared/api/schema/supply-chain";
import { afterSalesTickets } from "@/shared/api/schema/after-sales";
import { eq, and, lt, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger('WorkbenchService');

// ============ 待办事项类型定义 ============

/** 待办事项分类 */
export type TodoCategory = 'LEAD' | 'ORDER' | 'PO' | 'PRODUCTION' | 'AFTER_SALES';

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

/** 统一的待办响应 */
export interface TodosResponse {
    categories: TodoCategoryMeta[];
    leads: LeadTodoItem[];
    orders: OrderTodoItem[];
    purchaseOrders: POTodoItem[];
    productionTasks: ProductionTodoItem[];
    afterSales: AfterSalesTodItem[];
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

                // 并行查询所有分类
                const [
                    pendingLeads,
                    draftOrders,
                    draftPOs,
                    pendingPrd,
                    pendingAS,
                ] = await Promise.all([
                    // 1. 待跟进线索
                    db.query.leads.findMany({
                        where: and(
                            eq(leads.tenantId, tenantId),
                            ...(isAdmin ? [] : [eq(leads.assignedSalesId, userId)]),
                            eq(leads.status, 'PENDING_FOLLOWUP')
                        ),
                        columns: {
                            id: true,
                            leadNo: true,
                            customerName: true,
                            customerPhone: true,
                            intentionLevel: true,
                            status: true,
                            createdAt: true,
                            lastActivityAt: true,
                        },
                        limit: 50,
                    }),

                    // 2. 未锁定订单
                    db.query.orders.findMany({
                        where: and(
                            eq(orders.tenantId, tenantId),
                            ...(isAdmin ? [] : [eq(orders.salesId, userId)]),
                            eq(orders.isLocked, false)
                        ),
                        columns: {
                            id: true,
                            orderNo: true,
                            customerName: true,
                            totalAmount: true,
                            status: true,
                            isLocked: true,
                            createdAt: true,
                        },
                        limit: 50,
                    }),

                    // 3. 草稿采购单
                    db.query.purchaseOrders.findMany({
                        where: and(
                            eq(purchaseOrders.tenantId, tenantId),
                            eq(purchaseOrders.status, 'DRAFT')
                        ),
                        columns: {
                            id: true,
                            poNo: true,
                            supplierName: true,
                            totalAmount: true,
                            status: true,
                            createdAt: true,
                        },
                        limit: 50,
                    }),

                    // 4. 待处理生产任务
                    db.query.productionTasks.findMany({
                        where: and(
                            eq(productionTasks.tenantId, tenantId),
                            eq(productionTasks.status, 'PENDING')
                        ),
                        columns: {
                            id: true,
                            taskNo: true,
                            workshop: true,
                            status: true,
                            createdAt: true,
                        },
                        limit: 50,
                    }),

                    // 5. 待处理售后工单
                    db.query.afterSalesTickets.findMany({
                        where: and(
                            eq(afterSalesTickets.tenantId, tenantId),
                            eq(afterSalesTickets.status, 'PENDING')
                        ),
                        columns: {
                            id: true,
                            ticketNo: true,
                            type: true,
                            priority: true,
                            status: true,
                            description: true,
                            createdAt: true,
                        },
                        limit: 50,
                    }),
                ]);

                // 构建分类元数据
                const categories: TodoCategoryMeta[] = [
                    { category: 'LEAD', label: '待跟进线索', count: pendingLeads.length, icon: 'Users', color: 'blue' },
                    { category: 'ORDER', label: '待处理订单', count: draftOrders.length, icon: 'ShoppingCart', color: 'amber' },
                    { category: 'PO', label: '草稿采购单', count: draftPOs.length, icon: 'Clipboard', color: 'purple' },
                    { category: 'PRODUCTION', label: '待处理生产', count: pendingPrd.length, icon: 'Factory', color: 'cyan' },
                    { category: 'AFTER_SALES', label: '售后工单', count: pendingAS.length, icon: 'Wrench', color: 'emerald' },
                ];

                return {
                    categories,
                    leads: pendingLeads as LeadTodoItem[],
                    orders: draftOrders as OrderTodoItem[],
                    purchaseOrders: draftPOs as POTodoItem[],
                    productionTasks: pendingPrd as ProductionTodoItem[],
                    afterSales: pendingAS as AfterSalesTodItem[],
                };
            },
            [`todos-${tenantId}-${userId}`],
            { revalidate: 60, tags: [`todos:${tenantId}`, `todos:${userId}`] }
        )();
    }

    /**
     * 获取报警数据
     * 聚合各模块的超时、逾期等报警信息
     * L5 优化：并行化查询，增加缓存
     */
    static async getAlerts(tenantId: string): Promise<AlertsResponse> {
        logger.info('获取工作台报警信息', { tenantId });
        return unstable_cache(
            async () => {
                const now = new Date();
                const items: AlertItem[] = [];

                // 1. 线索跟进超时 — 超过 48 小时未跟进的线索
                const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

                const [overdueLeads, slaOverdueTickets, delayedPOs] = await Promise.all([
                    db.query.leads.findMany({
                        where: and(eq(leads.tenantId, tenantId), eq(leads.status, 'PENDING_FOLLOWUP'), lt(leads.createdAt, twoDaysAgo)),
                        columns: { id: true, leadNo: true, customerName: true, createdAt: true },
                        limit: 20,
                    }),
                    db.query.afterSalesTickets.findMany({
                        where: and(eq(afterSalesTickets.tenantId, tenantId), eq(afterSalesTickets.status, 'PENDING'), lt(afterSalesTickets.slaResponseDeadline, now)),
                        columns: { id: true, ticketNo: true, type: true, slaResponseDeadline: true, createdAt: true },
                        limit: 20,
                    }),
                    db.query.purchaseOrders.findMany({
                        where: and(eq(purchaseOrders.tenantId, tenantId), inArray(purchaseOrders.status, ['IN_PRODUCTION', 'READY', 'SHIPPED', 'PENDING_PAYMENT']), lt(purchaseOrders.expectedDate, now)),
                        columns: { id: true, poNo: true, supplierName: true, expectedDate: true, createdAt: true },
                        limit: 20,
                    })
                ]);

                overdueLeads.forEach(l => {
                    items.push({
                        id: `alert-lead-${l.id}`,
                        category: 'LEAD_OVERDUE',
                        severity: 'warning',
                        title: `线索 ${l.leadNo} 跟进超时`,
                        description: `客户 ${l.customerName} 的线索超过 48 小时未跟进`,
                        relatedId: l.id,
                        relatedType: 'LEAD',
                        createdAt: l.createdAt,
                    });
                });

                slaOverdueTickets.forEach(t => {
                    items.push({
                        id: `alert-sla-${t.id}`,
                        category: 'SLA_OVERDUE',
                        severity: 'error',
                        title: `售后工单 ${t.ticketNo} SLA 超时`,
                        description: `工单类型: ${t.type}，已超过 SLA 响应期限`,
                        relatedId: t.id,
                        relatedType: 'AFTER_SALES',
                        createdAt: t.createdAt,
                    });
                });

                delayedPOs.forEach(po => {
                    items.push({
                        id: `alert-delivery-${po.id}`,
                        category: 'DELIVERY_DELAY',
                        severity: 'warning',
                        title: `采购单 ${po.poNo} 交货延迟`,
                        description: `供应商: ${po.supplierName || '未知'}，已超过预计交货时间`,
                        relatedId: po.id,
                        relatedType: 'PO',
                        createdAt: po.createdAt,
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
                            category: item.category,
                            label: labelMap[item.category],
                            count: 1,
                            severity: item.severity,
                        });
                    }
                });

                return {
                    categories: Array.from(categoryMap.values()),
                    items,
                };
            },
            [`alerts-${tenantId}`],
            { revalidate: 60, tags: [`alerts:${tenantId}`] }
        )();
    }
}
