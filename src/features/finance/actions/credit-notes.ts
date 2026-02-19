'use server';

/**
 * 贷项通知单管理 (Credit Notes)
 * 
 * 用于处理客户退款、折让等场景
 * 贷项通知单会减少客户的应收款
 */

import { db } from '@/shared/api/db';
import { creditNotes, arStatements } from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';
import { eq, and, desc, sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateBusinessNo } from '@/shared/lib/generate-no';

// 生成贷项通知单号
// 生成贷项通知单号
function generateCreditNoteNo(): string {
    return generateBusinessNo('CN');
}

// 创建贷项通知单 Schema
const createCreditNoteSchema = z.object({
    customerId: z.string().uuid(),
    customerName: z.string().min(1, '客户名称必填'),
    orderId: z.string().uuid().optional(),
    arStatementId: z.string().uuid().optional(),
    type: z.enum(['REFUND', 'DISCOUNT', 'ADJUSTMENT']),
    amount: z.number().positive('金额必须大于0'),
    reason: z.string().min(1, '原因必填').max(200),
    description: z.string().optional(),
    remark: z.string().optional(),
});

/**
 * 创建贷项通知单
 */
export async function createCreditNote(input: z.infer<typeof createCreditNoteSchema>) {
    try {
        const data = createCreditNoteSchema.parse(input);
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

        const [creditNote] = await db.insert(creditNotes).values({
            tenantId,
            creditNoteNo: generateCreditNoteNo(),
            customerId: data.customerId,
            customerName: data.customerName,
            orderId: data.orderId,
            arStatementId: data.arStatementId,
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
            tableName: 'credit_notes',
            recordId: creditNote.id,
            action: 'CREATE',
            newValues: creditNote as Record<string, any>,
            details: { creditNoteNo: creditNote.creditNoteNo, amount: data.amount }
        });

        revalidatePath('/finance/credit-notes');

        return {
            success: true,
            data: creditNote,
            message: '贷项通知单已创建，待审批'
        };
    } catch (error) {
        console.error('创建贷项通知单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '创建失败'
        };
    }
}

/**
 * 审批贷项通知单
 */
export async function approveCreditNote(id: string, approved: boolean, rejectReason?: string) {
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

        // 获取贷项通知单
        const creditNote = await db.query.creditNotes.findFirst({
            where: and(
                eq(creditNotes.id, id),
                eq(creditNotes.tenantId, tenantId)
            )
        });

        if (!creditNote) {
            return { success: false, error: '贷项通知单不存在' };
        }

        if (creditNote.status !== 'PENDING') {
            return { success: false, error: '仅待审批状态可审批' };
        }

        // 自审防护 F-23
        if (creditNote.createdBy === userId) {
            return { success: false, error: '不允许审批自己创建的通知单（四眼原则）' };
        }

        if (approved) {
            // 审批通过，更新状态并应用到AR对账单
            await db.transaction(async (tx) => {
                // 更新贷项通知单状态
                await tx.update(creditNotes)
                    .set({
                        status: 'APPROVED',
                        approvedBy: userId,
                        approvedAt: new Date(),
                        appliedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(eq(creditNotes.id, id));

                // 如果关联了AR对账单，更新应收余额
                if (creditNote.arStatementId) {
                    const amount = new Decimal(creditNote.amount || '0');
                    const amountStr = amount.toFixed(2, Decimal.ROUND_HALF_UP);

                    await tx.update(arStatements)
                        .set({
                            // 减少待收金额
                            pendingAmount: sql`GREATEST(0, CAST(${arStatements.pendingAmount} AS DECIMAL) - ${amountStr})`,
                            // 增加已收金额（折让视为收款）
                            receivedAmount: sql`CAST(${arStatements.receivedAmount} AS DECIMAL) + ${amountStr}`,
                        })
                        .where(and(
                            eq(arStatements.id, creditNote.arStatementId),
                            eq(arStatements.tenantId, tenantId)
                        ));
                }

                // 记录审计日志 F-32
                await AuditService.log(tx, {
                    tenantId,
                    userId: userId!,
                    tableName: 'credit_notes',
                    recordId: id,
                    action: 'APPROVE',
                    newValues: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() } as Record<string, any>,
                    oldValues: { status: creditNote.status },
                    details: { creditNoteNo: creditNote.creditNoteNo, approved: true }
                });
            });

            revalidatePath('/finance/credit-notes');
            revalidatePath('/finance/ar');

            return { success: true, message: '贷项通知单已审批通过并生效' };
        } else {
            // 审批拒绝
            await db.update(creditNotes)
                .set({
                    status: 'REJECTED',
                    approvedBy: userId,
                    approvedAt: new Date(),
                    remark: creditNote.remark
                        ? `${creditNote.remark}｜拒绝原因: ${rejectReason || '无'}`
                        : `拒绝原因: ${rejectReason || '无'}`,
                    updatedAt: new Date(),
                })
                .where(eq(creditNotes.id, id));

            // 记录审计日志 F-32
            await AuditService.log(db, {
                tenantId,
                userId: userId!,
                tableName: 'credit_notes',
                recordId: id,
                action: 'UPDATE',
                newValues: { status: 'REJECTED' },
                oldValues: { status: creditNote.status },
                details: { creditNoteNo: creditNote.creditNoteNo, approved: false, reason: rejectReason }
            });

            revalidatePath('/finance/credit-notes');

            return { success: true, message: '贷项通知单已拒绝' };
        }
    } catch (error) {
        console.error('审批贷项通知单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '审批失败'
        };
    }
}

/**
 * 获取贷项通知单列表
 */
export async function getCreditNotes(page = 1, pageSize = 20) {
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

    const notes = await db.query.creditNotes.findMany({
        where: eq(creditNotes.tenantId, tenantId),
        limit: pageSize,
        offset,
        orderBy: [desc(creditNotes.createdAt)],
    });

    return { success: true, data: notes };
}

/**
 * 获取贷项通知单详情
 */
export async function getCreditNote(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 权限检查 F-29
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) {
        return { success: false, error: '权限不足：需要财务查看权限' };
    }

    const creditNote = await db.query.creditNotes.findFirst({
        where: and(
            eq(creditNotes.id, id),
            eq(creditNotes.tenantId, session.user.tenantId)
        )
    });

    if (!creditNote) {
        return { success: false, error: '贷项通知单不存在' };
    }

    return { success: true, data: creditNote };
}
