import { db } from '@/shared/api/db';
import { purchaseOrders } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { ProcurementDashboard } from '@/features/supply-chain/components/procurement-dashboard';

export default async function OverviewPage() {
    const session = await auth();
    if (!session) return null;
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    // Fetch all DRAFT POs for this tenant
    const drafts = await db.query.purchaseOrders.findMany({
        where: and(
            eq(purchaseOrders.tenantId, session.user.tenantId),
            eq(purchaseOrders.status, 'DRAFT')
        ),
        orderBy: [desc(purchaseOrders.createdAt)],
        with: {
            order: {
                columns: {
                    orderNo: true
                }
            }
        }
    });

    const simpleDrafts = drafts.map(po => ({
        id: po.id,
        poNo: po.poNo,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        totalCost: po.totalAmount,
        orderNo: po.order?.orderNo,
        createdAt: po.createdAt!
    }));

    return (
        <div className="container mx-auto py-6 max-w-5xl">
            <ProcurementDashboard draftPos={simpleDrafts} />
        </div>
    );
}
