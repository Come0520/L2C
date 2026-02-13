'use server';

/**
 * 借项通知单管理 (Debit Notes)
 * 
 * 用于处理供应商扣款、退货等场景
 * 借项通知单会减少对供应商的应付款
 */

import { db } from '@/shared/api/db';
import { debitNotes, apSupplierStatements } from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 生成借项通知单号
function generateDebitNoteNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DN-${dateStr}-${random}`;
}

// 创建借项通知单 Schema
const createDebitNoteSchema = z.object({
    supplierId: z.string().uuid(),
    supplierName: z.string().min(1, '供应商名称必填'),
    purchaseOrderId: z.string().uuid().optional(),
    apStatementId: z.string().uuid().optional(),
    type: z.enum(['RETURN', 'QUALITY_DEDUCTION', 'ADJUSTMENT']),
    amount: z.number().positive('金额必须大于0'),
    reason: z.string().min(1, '原因必填').max(200),
    description: z.string().optional(),
    remark: z.string().optional(),
});

/**
 * 创建借项通知单
 */
export async function createDebitNote(input: z.infer<typeof createDebitNoteSchema>) {
    try {
        const data = createDebitNoteSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        // 权限检查：需要财务管理权限
        await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

        const [debitNote] = await db.insert(debitNotes).values({
            tenantId,
            debitNoteNo: generateDebitNoteNo(),
            supplierId: data.supplierId,
            supplierName: data.supplierName,
            purchaseOrderId: data.purchaseOrderId,
            apStatementId: data.apStatementId,
            type: data.type,
            amount: String(data.amount),
            reason: data.reason,
            description: data.description,
            status: 'PENDING', // 创建后待审批
            createdBy: userId,
            remark: data.remark,
        }).returning();

        revalidatePath('/finance/debit-notes');

        return {
            success: true,
            data: debitNote,
            message: '借项通知单已创建，待审批'
        };
    } catch (error) {
        console.error('创建借项通知单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '创建失败'
        };
    }
}

/**
 * 审批借项通知单
 */
export async function approveDebitNote(id: string, approved: boolean, rejectReason?: string) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        // 权限检查：需要财务管理权限
        await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);


        // 获取借项通知单
        const debitNote = await db.query.debitNotes.findFirst({
            where: and(
                eq(debitNotes.id, id),
                eq(debitNotes.tenantId, tenantId)
            )
        });

        if (!debitNote) {
            return { success: false, error: '借项通知单不存在' };
        }

        if (debitNote.status !== 'PENDING') {
            return { success: false, error: '仅待审批状态可审批' };
        }

        if (approved) {
            // 审批通过，更新状态并应用到AP对账单
            await db.transaction(async (tx) => {
                // 更新借项通知单状态
                await tx.update(debitNotes)
                    .set({
                        status: 'APPROVED',
                        approvedBy: userId,
                        approvedAt: new Date(),
                        appliedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(debitNotes.id, id));

                // 如果关联了AP对账单，更新应付余额
                if (debitNote.apStatementId) {
                    const amount = Number(debitNote.amount);
                    await tx.update(apSupplierStatements)
                        .set({
                            // 减少待付金额
                            pendingAmount: sql`GREATEST(0, ${apSupplierStatements.pendingAmount} - ${amount})`,
                            // 增加已付金额（扣款视为付款）
                            paidAmount: sql`${apSupplierStatements.paidAmount} + ${amount}`,
                        })
                        .where(eq(apSupplierStatements.id, debitNote.apStatementId));
                }
            });

            revalidatePath('/finance/debit-notes');
            revalidatePath('/finance/ap');

            return { success: true, message: '借项通知单已审批通过并生效' };
        } else {
            // 审批拒绝
            await db.update(debitNotes)
                .set({
                    status: 'REJECTED',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    remark: debitNote.remark
                        ? `${debitNote.remark}｜拒绝原因: ${rejectReason || '无'}`
                        : `拒绝原因: ${rejectReason || '无'}`,
                    updatedAt: new Date(),
                })
                .where(eq(debitNotes.id, id));

            revalidatePath('/finance/debit-notes');

            return { success: true, message: '借项通知单已拒绝' };
        }
    } catch (error) {
        console.error('审批借项通知单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '审批失败'
        };
    }
}

/**
 * 获取借项通知单列表
 */
export async function getDebitNotes(page = 1, pageSize = 20) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    const tenantId = session.user.tenantId;
    const offset = (page - 1) * pageSize;

    const notes = await db.query.debitNotes.findMany({
        where: eq(debitNotes.tenantId, tenantId),
        limit: pageSize,
        offset,
        orderBy: [desc(debitNotes.createdAt)],
    });

    return { success: true, data: notes };
}

/**
 * 获取借项通知单详情
 */
export async function getDebitNote(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    const debitNote = await db.query.debitNotes.findFirst({
        where: and(
            eq(debitNotes.id, id),
            eq(debitNotes.tenantId, session.user.tenantId)
        )
    });

    if (!debitNote) {
        return { success: false, error: '借项通知单不存在' };
    }

    return { success: true, data: debitNote };
}
