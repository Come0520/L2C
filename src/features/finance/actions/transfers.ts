'use server';

/**
 * 资金调拨管理 (Internal Transfers)
 * 
 * 功能：
 * 1. 创建资金调拨单
 * 2. 执行调拨（生成双边流水）
 * 3. 取消调拨
 */

import { db } from '@/shared/api/db';
import { financeAccounts, accountTransactions, internalTransfers } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 生成调拨单号
function generateTransferNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TRF-${dateStr}-${random}`;
}

// 生成流水号
function generateTransactionNo(prefix: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
}

// 创建调拨单 Schema
const createTransferSchema = z.object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number().positive('调拨金额必须大于0'),
    remark: z.string().optional(),
});

/**
 * 创建并执行资金调拨
 * 
 * 在事务中完成：
 * 1. 验证源账户余额充足
 * 2. 创建调拨单
 * 3. 扣减源账户余额
 * 4. 增加目标账户余额
 * 5. 生成双边流水记录
 */
export async function createInternalTransfer(input: z.infer<typeof createTransferSchema>) {
    try {
        const data = createTransferSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        // 验证不能自己转给自己
        if (data.fromAccountId === data.toAccountId) {
            return { success: false, error: '源账户和目标账户不能相同' };
        }

        return await db.transaction(async (tx) => {
            // 1. 获取并锁定源账户
            const fromAccount = await tx.query.financeAccounts.findFirst({
                where: and(
                    eq(financeAccounts.id, data.fromAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                )
            });

            if (!fromAccount) {
                return { success: false, error: '源账户不存在' };
            }

            if (!fromAccount.isActive) {
                return { success: false, error: '源账户已停用' };
            }

            const fromBalance = Number(fromAccount.balance);
            if (fromBalance < data.amount) {
                return { success: false, error: `源账户余额不足，当前余额: ¥${fromBalance.toLocaleString()}` };
            }

            // 2. 获取目标账户
            const toAccount = await tx.query.financeAccounts.findFirst({
                where: and(
                    eq(financeAccounts.id, data.toAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                )
            });

            if (!toAccount) {
                return { success: false, error: '目标账户不存在' };
            }

            if (!toAccount.isActive) {
                return { success: false, error: '目标账户已停用' };
            }

            const transferNo = generateTransferNo();
            const toBalance = Number(toAccount.balance);

            // 3. 创建调拨单 (先创建，后更新关联)
            const [transfer] = await tx.insert(internalTransfers).values({
                tenantId,
                transferNo,
                fromAccountId: data.fromAccountId,
                toAccountId: data.toAccountId,
                amount: String(data.amount),
                status: 'COMPLETED',
                remark: data.remark,
                createdBy: userId,
                approvedBy: userId,
                approvedAt: new Date(),
            }).returning();

            // 4. 扣减源账户余额
            await tx.update(financeAccounts)
                .set({
                    balance: sql`${financeAccounts.balance} - ${data.amount}`,
                })
                .where(eq(financeAccounts.id, data.fromAccountId));

            // 5. 创建源账户流水（支出）
            const [fromTransaction] = await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateTransactionNo('TXN-OUT'),
                accountId: data.fromAccountId,
                transactionType: 'EXPENSE',
                amount: String(data.amount),
                balanceBefore: String(fromBalance),
                balanceAfter: String(fromBalance - data.amount),
                relatedType: 'INTERNAL_TRANSFER',
                relatedId: transfer.id,
                remark: `资金调拨至 ${toAccount.accountName}`,
            }).returning();

            // 6. 增加目标账户余额
            await tx.update(financeAccounts)
                .set({
                    balance: sql`${financeAccounts.balance} + ${data.amount}`,
                })
                .where(eq(financeAccounts.id, data.toAccountId));

            // 7. 创建目标账户流水（收入）
            const [toTransaction] = await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateTransactionNo('TXN-IN'),
                accountId: data.toAccountId,
                transactionType: 'INCOME',
                amount: String(data.amount),
                balanceBefore: String(toBalance),
                balanceAfter: String(toBalance + data.amount),
                relatedType: 'INTERNAL_TRANSFER',
                relatedId: transfer.id,
                remark: `资金调入自 ${fromAccount.accountName}`,
            }).returning();

            // 8. 更新调拨单关联流水
            await tx.update(internalTransfers)
                .set({
                    fromTransactionId: fromTransaction.id,
                    toTransactionId: toTransaction.id,
                })
                .where(eq(internalTransfers.id, transfer.id));

            revalidatePath('/finance');
            revalidatePath('/finance/accounts');

            return {
                success: true,
                data: {
                    transferId: transfer.id,
                    transferNo,
                    fromAccount: fromAccount.accountName,
                    toAccount: toAccount.accountName,
                    amount: data.amount,
                    message: '资金调拨成功'
                }
            };
        });
    } catch (error) {
        console.error('资金调拨失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '调拨失败'
        };
    }
}

/**
 * 获取调拨记录列表
 */
export async function getInternalTransfers(page = 1, pageSize = 20) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    const tenantId = session.user.tenantId;
    const offset = (page - 1) * pageSize;

    const transfers = await db.query.internalTransfers.findMany({
        where: eq(internalTransfers.tenantId, tenantId),
        with: {
            fromAccount: {
                columns: { accountName: true, accountNo: true }
            },
            toAccount: {
                columns: { accountName: true, accountNo: true }
            },
            createdByUser: {
                columns: { name: true }
            }
        },
        limit: pageSize,
        offset,
        orderBy: (transfers, { desc }) => [desc(transfers.createdAt)],
    });

    return { success: true, data: transfers };
}

/**
 * 取消/冲销资金调拨
 * 
 * 业务逻辑：
 * 1. 仅允许冲销已完成的调拨单
 * 2. 创建反向流水记录
 * 3. 恢复双方账户余额
 */
export async function cancelInternalTransfer(transferId: string, reason?: string) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;
        const _userId = session.user.id;

        return await db.transaction(async (tx) => {
            // 1. 获取调拨单
            const transfer = await tx.query.internalTransfers.findFirst({
                where: and(
                    eq(internalTransfers.id, transferId),
                    eq(internalTransfers.tenantId, tenantId)
                ),
                with: {
                    fromAccount: true,
                    toAccount: true,
                }
            });

            if (!transfer) {
                return { success: false, error: '调拨单不存在' };
            }

            if (transfer.status !== 'COMPLETED') {
                return { success: false, error: '仅已完成的调拨单可冲销' };
            }

            const amount = Number(transfer.amount);

            // 2. 获取当前账户余额
            const fromAccount = await tx.query.financeAccounts.findFirst({
                where: eq(financeAccounts.id, transfer.fromAccountId)
            });
            const toAccount = await tx.query.financeAccounts.findFirst({
                where: eq(financeAccounts.id, transfer.toAccountId)
            });

            if (!fromAccount || !toAccount) {
                return { success: false, error: '关联账户不存在' };
            }

            const fromBalance = Number(fromAccount.balance);
            const toBalance = Number(toAccount.balance);

            // 检查目标账户余额是否足够冲销
            if (toBalance < amount) {
                return { success: false, error: `目标账户余额不足，无法冲销。当前余额: ¥${toBalance.toLocaleString()}` };
            }

            // 3. 恢复源账户余额（加回）
            await tx.update(financeAccounts)
                .set({ balance: sql`${financeAccounts.balance} + ${amount}` })
                .where(eq(financeAccounts.id, transfer.fromAccountId));

            // 4. 扣减目标账户余额
            await tx.update(financeAccounts)
                .set({ balance: sql`${financeAccounts.balance} - ${amount}` })
                .where(eq(financeAccounts.id, transfer.toAccountId));

            // 5. 创建冲销流水 - 源账户收入
            await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateTransactionNo('REV-IN'),
                accountId: transfer.fromAccountId,
                transactionType: 'INCOME',
                amount: String(amount),
                balanceBefore: String(fromBalance),
                balanceAfter: String(fromBalance + amount),
                relatedType: 'TRANSFER_REVERSAL',
                relatedId: transfer.id,
                remark: `冲销调拨: ${transfer.transferNo}${reason ? ` (${reason})` : ''}`,
            });

            // 6. 创建冲销流水 - 目标账户支出
            await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateTransactionNo('REV-OUT'),
                accountId: transfer.toAccountId,
                transactionType: 'EXPENSE',
                amount: String(amount),
                balanceBefore: String(toBalance),
                balanceAfter: String(toBalance - amount),
                relatedType: 'TRANSFER_REVERSAL',
                relatedId: transfer.id,
                remark: `冲销调拨: ${transfer.transferNo}${reason ? ` (${reason})` : ''}`,
            });

            // 7. 更新调拨单状态为已取消
            await tx.update(internalTransfers)
                .set({
                    status: 'CANCELLED',
                    remark: transfer.remark
                        ? `${transfer.remark}｜冲销原因: ${reason || '无'}`
                        : `冲销原因: ${reason || '无'}`,
                    updatedAt: new Date(),
                })
                .where(eq(internalTransfers.id, transferId));

            revalidatePath('/finance');
            revalidatePath('/finance/transfers');

            return {
                success: true,
                message: '调拨单已冲销',
                data: {
                    transferNo: transfer.transferNo,
                    amount,
                }
            };
        });
    } catch (error) {
        console.error('冲销调拨失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '冲销失败'
        };
    }
}

/**
 * 获取调拨单详情
 */
export async function getInternalTransfer(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    const transfer = await db.query.internalTransfers.findFirst({
        where: and(
            eq(internalTransfers.id, id),
            eq(internalTransfers.tenantId, session.user.tenantId)
        ),
        with: {
            fromAccount: true,
            toAccount: true,
            createdByUser: { columns: { name: true } },
            approvedByUser: { columns: { name: true } },
        }
    });

    if (!transfer) {
        return { success: false, error: '调拨单不存在' };
    }

    return { success: true, data: transfer };
}
