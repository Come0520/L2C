'use server';

/**
 * 借项通知单管理 (Debit Notes)
 * 
 * 用于处理供应商扣款、退货等场景
 * 借项通知单会减少对供应商的应付款
 */

import { db } from '@/shared/api/db';
import { debitNotes, apSupplierStatements } from '@/shared/api/schema/finance';
import { AuditService } from '@/shared/services/audit-service';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateBusinessNo } from '@/shared/lib/generate-no';

// 生成借项通知单号
// 生成借项通知单号
function generateDebitNoteNo(): string {
    return generateBusinessNo('DN');
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
        if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) {
            return { success: false, error: '权限不足：需要财务管理权限' };
        }

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

        // 记录审计日志 F-32
        await AuditService.log(db, {
            tenantId,
            userId: userId!,
            tableName: 'debit_notes',
            recordId: debitNote.id,
            action: 'CREATE',
            newValues: debitNote as Record<string, any>,
            details: { debitNoteNo: debitNote.debitNoteNo, amount: data.amount }
        });

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
        if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) {
            return { success: false, error: '权限不足：需要财务管理权限' };
        }


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

        // 自审防护 F-23
        if (debitNote.createdBy === userId) {
            return { success: false, error: '不允许审批自己创建的通知单（四眼原则）' };
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
                    const amount = new Decimal(debitNote.amount || '0');
                    const amountStr = amount.toFixed(2, Decimal.ROUND_HALF_UP);

                    await tx.update(apSupplierStatements)
                        .set({
                            // 减少待付金额
                            pendingAmount: sql`GREATEST(0, CAST(${apSupplierStatements.pendingAmount} AS DECIMAL) - ${amountStr})`,
                            // 增加已付金额（扣款视为付款）
                            paidAmount: sql`CAST(${apSupplierStatements.paidAmount} AS DECIMAL) + ${amountStr}`,
                        })
                        .where(and(
                            eq(apSupplierStatements.id, debitNote.apStatementId),
                            eq(apSupplierStatements.tenantId, tenantId)
                        ));
                }

                // 记录审计日志 F-32
                await AuditService.log(tx, {
                    tenantId,
                    userId: userId!,
                    tableName: 'debit_notes',
                    recordId: id,
                    action: 'UPDATE',
                    newValues: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
                    oldValues: { status: debitNote.status },
                    details: { debitNoteNo: debitNote.debitNoteNo, approved: true }
                });
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

            // 记录审计日志 F-32
            await AuditService.log(db, {
                tenantId,
                userId: userId!,
                tableName: 'debit_notes',
                recordId: id,
                action: 'UPDATE',
                newValues: { status: 'REJECTED' },
                oldValues: { status: debitNote.status },
                details: { debitNoteNo: debitNote.debitNoteNo, approved: false, reason: rejectReason }
            });

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

    // 权限检查 F-29
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) {
        return { success: false, error: '权限不足：需要财务查看权限', data: [] };
    }

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

    // 权限检查 F-29
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) {
        return { success: false, error: '权限不足：需要财务查看权限' };
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
