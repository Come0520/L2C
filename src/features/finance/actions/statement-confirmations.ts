'use server';

/**
 * 对账确认管理 (Statement Confirmations)
 * 
 * 用于生成和管理月结客户/供应商的对账确认单
 */

import { db } from '@/shared/api/db';
import { statementConfirmations, statementConfirmationDetails, arStatements, apSupplierStatements } from '@/shared/api/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 生成确认单号
function generateConfirmationNo(type: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${type === 'CUSTOMER' ? 'CC' : 'SC'}-${dateStr}-${random}`;
}

// 创建对账确认单 Schema
const generateConfirmationSchema = z.object({
    type: z.enum(['CUSTOMER', 'SUPPLIER']),
    targetId: z.string().uuid(),
    targetName: z.string().min(1),
    periodStart: z.string(), // YYYY-MM-DD
    periodEnd: z.string(),
    periodLabel: z.string().optional(),
});

/**
 * 生成月结对账确认单
 * 
 * 1. 按客户/供应商和周期聚合账单
 * 2. 创建对账确认主表
 * 3. 创建对账确认明细
 */
export async function generateStatementConfirmation(input: z.infer<typeof generateConfirmationSchema>) {
    try {
        const data = generateConfirmationSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        return await db.transaction(async (tx) => {
            let statements: Array<{
                id: string;
                statementNo: string;
                createdAt: Date | null;
                totalAmount: string;
            }> = [];

            // 根据类型获取相应账单
            if (data.type === 'CUSTOMER') {
                const arResults = await tx.query.arStatements.findMany({
                    where: and(
                        eq(arStatements.tenantId, tenantId),
                        eq(arStatements.customerId, data.targetId),
                        gte(arStatements.createdAt, new Date(data.periodStart)),
                        lte(arStatements.createdAt, new Date(data.periodEnd))
                    )
                });
                statements = arResults.map(s => ({
                    id: s.id,
                    statementNo: s.statementNo,
                    createdAt: s.createdAt,
                    totalAmount: s.totalAmount,
                }));
            } else {
                const apResults = await tx.query.apSupplierStatements.findMany({
                    where: and(
                        eq(apSupplierStatements.tenantId, tenantId),
                        eq(apSupplierStatements.supplierId, data.targetId),
                        gte(apSupplierStatements.createdAt, new Date(data.periodStart)),
                        lte(apSupplierStatements.createdAt, new Date(data.periodEnd))
                    )
                });
                statements = apResults.map(s => ({
                    id: s.id,
                    statementNo: s.statementNo,
                    createdAt: s.createdAt,
                    totalAmount: s.totalAmount,
                }));
            }

            if (statements.length === 0) {
                return { success: false, error: '该周期内没有找到账单' };
            }

            // 计算总金额
            const totalAmount = statements.reduce((sum, s) => {
                return sum + parseFloat(s.totalAmount || '0');
            }, 0);

            // 生成周期标签
            const periodLabel = data.periodLabel ||
                `${data.periodStart.slice(0, 7)} 至 ${data.periodEnd.slice(0, 7)}`;

            // 创建对账确认单
            const [confirmation] = await tx.insert(statementConfirmations).values({
                tenantId,
                confirmationNo: generateConfirmationNo(data.type),
                type: data.type,
                targetId: data.targetId,
                targetName: data.targetName,
                periodStart: data.periodStart,
                periodEnd: data.periodEnd,
                periodLabel,
                totalAmount: totalAmount.toFixed(2),
                status: 'PENDING',
                createdBy: userId!,
            }).returning();

            // 创建明细
            for (const stmt of statements) {
                await tx.insert(statementConfirmationDetails).values({
                    tenantId,
                    confirmationId: confirmation.id,
                    documentType: data.type === 'CUSTOMER' ? 'AR_STATEMENT' : 'AP_SUPPLIER_STATEMENT',
                    documentId: stmt.id,
                    documentNo: stmt.statementNo,
                    documentDate: stmt.createdAt?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10),
                    documentAmount: stmt.totalAmount,
                    status: 'PENDING',
                });
            }

            revalidatePath('/finance/confirmations');

            return {
                success: true,
                data: {
                    confirmationId: confirmation.id,
                    confirmationNo: confirmation.confirmationNo,
                    statementCount: statements.length,
                    totalAmount,
                },
                message: '对账确认单已生成'
            };
        });
    } catch (error) {
        console.error('生成对账确认单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '生成失败'
        };
    }
}

/**
 * 确认对账单
 */
export async function confirmStatement(
    confirmationId: string,
    confirmedBy: string,
    disputedItems?: Array<{ detailId: string; reason: string }>
) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;

        return await db.transaction(async (tx) => {
            // 获取确认单
            const confirmation = await tx.query.statementConfirmations.findFirst({
                where: and(
                    eq(statementConfirmations.id, confirmationId),
                    eq(statementConfirmations.tenantId, tenantId)
                )
            });

            if (!confirmation) {
                return { success: false, error: '对账确认单不存在' };
            }

            const hasDisputes = disputedItems && disputedItems.length > 0;
            let disputedAmount = 0;

            // 处理争议项
            if (hasDisputes) {
                for (const item of disputedItems) {
                    const detail = await tx.query.statementConfirmationDetails.findFirst({
                        where: eq(statementConfirmationDetails.id, item.detailId)
                    });

                    if (detail) {
                        await tx.update(statementConfirmationDetails)
                            .set({
                                status: 'DISPUTED',
                                disputeReason: item.reason,
                            })
                            .where(eq(statementConfirmationDetails.id, item.detailId));

                        disputedAmount += parseFloat(detail.documentAmount);
                    }
                }
            }

            // 更新其他项为已确认
            await tx.update(statementConfirmationDetails)
                .set({ status: 'CONFIRMED' })
                .where(and(
                    eq(statementConfirmationDetails.confirmationId, confirmationId),
                    eq(statementConfirmationDetails.status, 'PENDING')
                ));

            // 更新确认单状态
            const totalAmount = parseFloat(confirmation.totalAmount);
            const confirmedAmount = totalAmount - disputedAmount;

            await tx.update(statementConfirmations)
                .set({
                    status: hasDisputes ? 'DISPUTED' : 'CONFIRMED',
                    confirmedAmount: confirmedAmount.toFixed(2),
                    disputedAmount: disputedAmount.toFixed(2),
                    confirmedAt: new Date(),
                    confirmedBy,
                    updatedAt: new Date(),
                })
                .where(eq(statementConfirmations.id, confirmationId));

            revalidatePath('/finance/confirmations');

            return {
                success: true,
                message: hasDisputes ? '对账已确认（含争议）' : '对账已确认'
            };
        });
    } catch (error) {
        console.error('确认对账失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '确认失败'
        };
    }
}

/**
 * 获取对账确认单列表
 */
export async function getStatementConfirmations(page = 1, pageSize = 20) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    const tenantId = session.user.tenantId;
    const offset = (page - 1) * pageSize;

    const confirmations = await db.query.statementConfirmations.findMany({
        where: eq(statementConfirmations.tenantId, tenantId),
        limit: pageSize,
        offset,
        orderBy: [desc(statementConfirmations.createdAt)],
    });

    return { success: true, data: confirmations };
}
