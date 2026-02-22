'use server';

import { logger } from "@/shared/lib/logger";

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
 * 创建借项通知单 (Create Debit Note)
 * 
 * 当向供应商主张扣款、退货索赔等应付调整时，财务人员可创建借项通知单。
 * 通知单创建后默认为 `PENDING` 待审批状态。
 * 底层会记录创建操作的审计日志。
 * 
 * @param {z.infer<typeof createDebitNoteSchema>} input - 包含供应商信息、关联订单/账单、类型、金额及扣款原因
 * @returns 返回新创建的借项通知单及状态信息
 * @throws {Error} 如果当前用户无权限或写入数据库失败
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
            newValues: debitNote as Record<string, unknown>,
            details: { debitNoteNo: debitNote.debitNoteNo, amount: data.amount }
        });

        revalidatePath('/finance/debit-notes');

        return {
            success: true,
            data: debitNote,
            message: '借项通知单已创建，待审批'
        };
    } catch (error) {
        logger.error('创建借项通知单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '创建失败'
        };
    }
}

/**
 * 审批借项通知单 (Approve Debit Note)
 * 
 * 财务人员审查待处理的借项通知单：
 * - 审批通过 (`APPROVED`): 并行更新关联的 AP 对账单的待付金额（扣减）和已付金额（增加）。
 * - 审批拒绝 (`REJECTED`): 不产生资金变动，仅补充拒绝缘由。
 * 包含四眼原则验证，禁止审批者审批自己的单据。
 * 记录相关金额应用日志及操作流转日志。
 * 
 * @param {string} id - 借项通知单ID
 * @param {boolean} approved - 是否通过审批
 * @param {string} [rejectReason] - 可选的拒绝原因，在 `approved=false` 时必填或自动补充为空
 * @returns 返回审批动作的生效数据和成功状态
 * @throws {Error} 若四眼原则冲突、单据非 `PENDING` 状态等情况将抛出错误
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
        logger.error('审批借项通知单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '审批失败'
        };
    }
}

/**
 * 获取借项通知单列表 (Get Debit Notes)
 * 
 * 分页查询当前租户下所有的借项通知单记录（含草稿、已审、退回等状态），按时间倒序。
 * 用于财务对账单列表视图展现。
 * 
 * @param {number} [page=1] - 当前页码
 * @param {number} [pageSize=20] - 每页条数
 * @returns 返回借项通知单分页数据集合
 * @throws {Error} 未授权或无视图权限时报错
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
 * 获取借项通知单详情 (Get Debit Note details)
 * 
 * 基于主键ID查询单条通知单明细，通常用于全屏展示、审批面板弹出等需要完整核对数据的场景。
 * 
 * @param {string} id - 借项通知单的唯一 ID
 * @returns 返回借项通知单详细模型
 * @throws {Error} 如果查询失败或记录不存在
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
