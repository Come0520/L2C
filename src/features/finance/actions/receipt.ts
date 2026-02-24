'use server';


import { db } from '@/shared/api/db';
import { receiptBills } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ReceiptService, CreateReceiptBillData } from '@/services/receipt.service';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidateTag } from 'next/cache';
import { AuditService } from '@/shared/services/audit-service';



/**
 * 获取收款单列表
 */
export async function getReceiptBills() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.receiptBills.findMany({
        where: eq(receiptBills.tenantId, session.user.tenantId),
        with: {
            customer: true,
            createdBy: true,
            items: true,
        },
        orderBy: [desc(receiptBills.createdAt)],
    });
}

/**
 * 创建收款单并提交审批
 */
export async function createAndSubmitReceipt(data: CreateReceiptBillData) {
    const session = await auth();
    if (!session?.user?.tenantId || !session.user.id) throw new Error('未授权');

    // 权限检查：需要财务管理权限
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const bill = await ReceiptService.createReceiptBill(data, session.user.tenantId, session.user.id);
    const result = await ReceiptService.submitForApproval(bill.id, session.user.tenantId);

    revalidateTag(`finance-receipt-${session.user.tenantId}`, 'default');
    return result;
}

/**
 * 撤回收款单 (如果是 DRAFT 或 PENDING_APPROVAL)
 */
export async function voidReceiptBill(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：需要财务管理权限
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const bill = await db.query.receiptBills.findFirst({
        where: and(eq(receiptBills.id, id), eq(receiptBills.tenantId, session.user.tenantId))
    });
    if (!bill) throw new Error('收款单不存在');
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(bill.status)) {
        throw new Error('当前状态不可撤回');
    }

    await db.update(receiptBills)
        .set({ status: 'VOIDED', updatedAt: new Date() })
        .where(and(eq(receiptBills.id, id), eq(receiptBills.tenantId, session.user.tenantId)));

    // F-32: 记录作废审计
    await AuditService.log(db, {
        tenantId: session.user.tenantId,
        userId: session.user.id!,
        tableName: 'receipt_bills',
        recordId: id,
        action: 'UPDATE',
        oldValues: { status: bill.status },
        newValues: { status: 'VOIDED' },
        details: { reason: 'USER_VOID' }
    });


    revalidateTag(`finance-receipt-${session.user.tenantId}`, 'default');
    return { success: true };
}
