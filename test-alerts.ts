import { db } from './src/shared/api/db';
import { afterSalesTickets } from './src/shared/api/schema/after-sales';
import { leads } from './src/shared/api/schema/leads';
import { purchaseOrders } from './src/shared/api/schema/supply-chain';
import { eq, and, lt, inArray } from 'drizzle-orm';

const tenantId = 'e772e5f7-95fe-4b27-9949-fc69de11d647';

async function main() {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // 1. 测试 leads 报警查询
    try {
        console.log('Testing leads alert query...');
        const overdueLeads = await db.query.leads.findMany({
            where: and(eq(leads.tenantId, tenantId), eq(leads.status, 'PENDING_FOLLOWUP'), lt(leads.createdAt, twoDaysAgo)),
            columns: { id: true, leadNo: true, customerName: true, createdAt: true },
            limit: 5,
        });
        console.log('Leads query OK:', overdueLeads.length);
    } catch (e: unknown) {
        console.error('Leads alert FAILED:', e instanceof Error ? e.message : e);
        // @ts-ignore
        if (e?.cause) console.error('Cause:', (e as Error & { cause?: { message: string } }).cause?.message);
    }

    // 2. 测试 afterSalesTickets SLA 超时查询
    try {
        console.log('Testing SLA alert query...');
        const slaOverdue = await db.query.afterSalesTickets.findMany({
            where: and(
                eq(afterSalesTickets.tenantId, tenantId),
                eq(afterSalesTickets.status, 'PENDING'),
                lt(afterSalesTickets.slaResponseDeadline, now)
            ),
            columns: { id: true, ticketNo: true, type: true, slaResponseDeadline: true, createdAt: true },
            limit: 5,
        });
        console.log('SLA query OK:', slaOverdue.length);
    } catch (e: unknown) {
        console.error('SLA alert FAILED:', e instanceof Error ? e.message : e);
        // @ts-ignore
        if (e?.cause) console.error('Cause:', (e as Error & { cause?: { message: string } }).cause?.message);
    }

    // 3. 测试 purchaseOrders 延迟查询
    try {
        console.log('Testing PO delay alert query...');
        const delayedPOs = await db.query.purchaseOrders.findMany({
            where: and(
                eq(purchaseOrders.tenantId, tenantId),
                inArray(purchaseOrders.status, ['IN_PRODUCTION', 'READY', 'SHIPPED', 'PENDING_PAYMENT']),
                lt(purchaseOrders.expectedDate, now)
            ),
            columns: { id: true, poNo: true, supplierName: true, expectedDate: true, createdAt: true },
            limit: 5,
        });
        console.log('PO delay query OK:', delayedPOs.length);
    } catch (e: unknown) {
        console.error('PO delay alert FAILED:', e instanceof Error ? e.message : e);
        // @ts-ignore
        if (e?.cause) console.error('Cause:', (e as Error & { cause?: { message: string } }).cause?.message);
    }

    process.exit(0);
}

main();
