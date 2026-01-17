import { db } from "@/shared/api/db";
import { leads } from "@/shared/api/schema/leads";
import { orders } from "@/shared/api/schema/orders";
import { purchaseOrders, productionTasks } from "@/shared/api/schema/supply-chain";
import { afterSalesTickets } from "@/shared/api/schema/after-sales";
import { eq, and } from "drizzle-orm";

export interface WorkbenchTodo {
    id: string;
    type: 'LEAD' | 'ORDER' | 'PO' | 'PRODUCTION' | 'AFTER_SALES';
    title: string;
    status: string;
    priority: string;
    createdAt: Date | null;
    link: string;
}

export class WorkbenchService {

    /**
     * Get Unified Todo List
     * Optimized for dashboard overview.
     */
    static async getUnifiedTodos(tenantId: string, userId: string) {
        const todos: WorkbenchTodo[] = [];

        // 1. Pending Leads (Assigned to user)
        const pendingLeads = await db.query.leads.findMany({
            where: and(
                eq(leads.tenantId, tenantId),
                eq(leads.assignedSalesId, userId),
                eq(leads.status, 'PENDING_ASSIGNMENT')
            ),
            limit: 10
        });
        pendingLeads.forEach(l => todos.push({
            id: l.id,
            type: 'LEAD',
            title: `Follow up lead: ${l.customerName}`,
            status: l.status || 'NEW',
            priority: 'HIGH',
            createdAt: l.createdAt,
            link: `/leads/${l.id}`
        }));

        // 2. Unlocked Orders (Pending locking/PO execution)
        const draftOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.tenantId, tenantId),
                eq(orders.salesId, userId),
                eq(orders.isLocked, false)
            ),
            limit: 10
        });
        draftOrders.forEach(o => todos.push({
            id: o.id,
            type: 'ORDER',
            title: `Order #${o.orderNo} needs locking`,
            status: 'DRAFT',
            priority: 'MEDIUM',
            createdAt: o.createdAt,
            link: `/orders/${o.id}`
        }));

        // 3. Draft Purchase Orders
        const draftPOs = await db.query.purchaseOrders.findMany({
            where: and(
                eq(purchaseOrders.tenantId, tenantId),
                eq(purchaseOrders.status, 'DRAFT')
            ),
            limit: 10
        });
        draftPOs.forEach(po => todos.push({
            id: po.id,
            type: 'PO',
            title: `Execute PO #${po.poNo}`,
            status: 'DRAFT',
            priority: 'HIGH',
            createdAt: po.createdAt,
            link: `/purchase-orders/${po.id}`
        }));

        // 4. Pending Production Tasks
        const pendingPrd = await db.query.productionTasks.findMany({
            where: and(
                eq(productionTasks.tenantId, tenantId),
                eq(productionTasks.status, 'PENDING')
            ),
            limit: 10
        });
        pendingPrd.forEach(p => todos.push({
            id: p.id,
            type: 'PRODUCTION',
            title: `Production: ${p.taskNo} (${p.workshop})`,
            status: 'PENDING',
            priority: 'MEDIUM',
            createdAt: p.createdAt,
            link: `/production/${p.id}`
        }));

        // 5. Open After-Sales Tickets
        const pendingAS = await db.query.afterSalesTickets.findMany({
            where: and(
                eq(afterSalesTickets.tenantId, tenantId),
                eq(afterSalesTickets.status, 'PENDING')
            ),
            limit: 10
        });
        pendingAS.forEach(as => todos.push({
            id: as.id,
            type: 'AFTER_SALES',
            title: `Ticket: ${as.ticketNo}`,
            status: 'PENDING',
            priority: as.priority || 'MEDIUM',
            createdAt: as.createdAt,
            link: `/after-sales/${as.id}`
        }));

        // Sort by creation date descending
        return todos.toSorted((a, b) => {
            const timeA = a.createdAt?.getTime() || 0;
            const timeB = b.createdAt?.getTime() || 0;
            return timeB - timeA;
        });
    }
}
