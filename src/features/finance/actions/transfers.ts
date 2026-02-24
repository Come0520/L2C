'use server';
import { unstable_cache, revalidateTag } from 'next/cache';

import { logger } from "@/shared/lib/logger";

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
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { generateBusinessNo } from '@/shared/lib/generate-no';
import { AuditService } from '@/shared/services/audit-service';

// 创建调拨单 Schema
const createTransferSchema = z.object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number().positive('调拨金额必须大于0'),
    remark: z.string().optional(),
});

/**
 * 创建并执行资金调拨 (Create Internal Transfer)
 * 
 * 在强一致性事务中完成资金在不同内部账户间的转移，涉及：
 * 1. 验证源账户是否有效且余额充足
 * 2. 扣减源账户余额（带乐观锁）并生成支出流水
 * 3. 增加目标账户余额并生成收入流水
 * 4. 创建资金调拨单，关联上述两条流水记录
 * 5. 记录完整的审计日志 (F-32)
 * 
 * @param {z.infer<typeof createTransferSchema>} input - 包含源账户ID、目标账户ID、调拨金额和备注
 * @returns 返回包含调拨单号和涉及账户信息的成功状态或失败错误源
 * @throws {Error} 未授权或缺少财务管理权限时返回错误对象
 */
export async function createInternalTransfer(input: z.infer<typeof createTransferSchema>) {
    try {
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }
        const tenantId = session.user.tenantId;

        // 权限检查
        if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) throw new Error('权限不足：需要财务管理权限');

        logger.info('[finance] 开始创建内部调拨', { input });
        const validatedData = createTransferSchema.parse(input);
        const userId = session.user.id;

        // 验证不能自己转给自己
        if (validatedData.fromAccountId === validatedData.toAccountId) {
            return { success: false, error: '源账户和目标账户不能相同' };
        }

        return await db.transaction(async (tx) => {
            // 1. 获取并锁定源账户
            const fromAccount = await tx.query.financeAccounts.findFirst({
                where: and(
                    eq(financeAccounts.id, validatedData.fromAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                )
            });

            if (!fromAccount) {
                return { success: false, error: '源账户不存在' };
            }

            if (!fromAccount.isActive) {
                return { success: false, error: '源账户已停用' };
            }

            const fromBalance = new Decimal(fromAccount.balance || '0');
            const transferAmount = new Decimal(validatedData.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            if (fromBalance.lt(transferAmount)) {
                return { success: false, error: `源账户余额不足，当前余额: ¥${fromBalance.toFixed(2, Decimal.ROUND_HALF_UP)}` };
            }

            // 2. 获取目标账户
            const toAccount = await tx.query.financeAccounts.findFirst({
                where: and(
                    eq(financeAccounts.id, validatedData.toAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                )
            });

            if (!toAccount) {
                return { success: false, error: '目标账户不存在' };
            }

            if (!toAccount.isActive) {
                return { success: false, error: '目标账户已停用' };
            }

            const transferNo = generateBusinessNo('TRF');
            const toBalance = new Decimal(toAccount.balance || '0');

            // 3. 创建调拨单 (先创建，后更新关联)
            const [transfer] = await tx.insert(internalTransfers).values({
                tenantId,
                transferNo,
                fromAccountId: validatedData.fromAccountId,
                toAccountId: validatedData.toAccountId,
                amount: transferAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                status: 'COMPLETED',
                remark: validatedData.remark,
                createdBy: userId,
                approvedBy: userId,
                approvedAt: new Date(),
            }).returning();

            // 4. 扣减源账户余额
            const fromNewBalance = fromBalance.minus(transferAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            await tx.update(financeAccounts)
                .set({
                    balance: fromNewBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                    updatedAt: new Date()
                })
                .where(and(
                    eq(financeAccounts.id, validatedData.fromAccountId),
                    eq(financeAccounts.tenantId, tenantId),
                    eq(financeAccounts.balance, fromBalance.toFixed(2, Decimal.ROUND_HALF_UP)) // 乐观锁检查
                ));


            // 5. 创建源账户流水（支出）
            const [fromTransaction] = await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateBusinessNo('TXN-OUT'),
                accountId: validatedData.fromAccountId,
                transactionType: 'EXPENSE',
                amount: transferAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceBefore: fromBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceAfter: fromBalance.minus(transferAmount).toFixed(2, Decimal.ROUND_HALF_UP),
                relatedType: 'INTERNAL_TRANSFER',
                relatedId: transfer.id,
                remark: `资金调拨至 ${toAccount.accountName}`,
            }).returning();

            // 6. 增加目标账户余额
            const toNewBalance = toBalance.plus(transferAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            await tx.update(financeAccounts)
                .set({
                    balance: toNewBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                    updatedAt: new Date()
                })
                .where(and(
                    eq(financeAccounts.id, validatedData.toAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                ));


            // 7. 创建目标账户流水（收入）
            const [toTransaction] = await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateBusinessNo('TXN-IN'),
                accountId: validatedData.toAccountId,
                transactionType: 'INCOME',
                amount: transferAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceBefore: toBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceAfter: toBalance.plus(transferAmount).toFixed(2, Decimal.ROUND_HALF_UP),
                relatedType: 'INTERNAL_TRANSFER',
                relatedId: transfer.id,
                remark: `资金调入自 ${fromAccount.accountName}`,
            }).returning();

            // 审计日志 F-32
            await AuditService.log(tx, {
                tenantId,
                userId: userId!,
                tableName: 'internal_transfers',
                recordId: transfer.id,
                action: 'CREATE_TRANSFER',
                newValues: transfer,
                details: {
                    from: fromAccount.accountName,
                    to: toAccount.accountName,
                    amount: transferAmount.toFixed(2, Decimal.ROUND_HALF_UP)
                }
            });

            // 8. 更新调拨单关联流水
            await tx.update(internalTransfers)
                .set({
                    fromTransactionId: fromTransaction.id,
                    toTransactionId: toTransaction.id,
                })
                .where(eq(internalTransfers.id, transfer.id));

            revalidateTag(`finance-transfer-${tenantId}`, 'default');

            logger.info('[finance] createInternalTransfer 执行成功', { transferNo });

            return {
                success: true,
                data: {
                    transferId: transfer.id,
                    transferNo,
                    fromAccount: fromAccount.accountName,
                    toAccount: toAccount.accountName,
                    amount: validatedData.amount,
                    message: '资金调拨成功'
                }
            };
        });
    } catch (error) {
        logger.error('[finance] 资金调拨失败', { error, input });
        logger.error('资金调拨失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '调拨失败'
        };
    }
}

/**
 * 获取资金调拨记录列表 (Get Internal Transfers)
 * 
 * 分页获取系统的内部资金调拨单历史记录，按创建时间倒序排列。
 * 查询包含关联的源账户和目标账户简要信息（名称和账号），以及操作人信息。
 * 
 * @param {object} [params] - 分页参数
 * @param {number} [params.limit=50] - 每页条数
 * @param {number} [params.offset=0] - 偏移量
 * @returns 返回调拨单列表及状态
 * @throws {Error} 未授权或缺少财务查看权限时返回带错误信息的对象
 */
export async function getInternalTransfers(params?: { limit?: number; offset?: number }) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) {
        return { success: false, error: '权限不足：需要财务管理权限', data: [] };
    }

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            logger.info('[finance] [CACHE_MISS] 获取内转列表', { tenantId, limit, offset });
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
                limit: limit,
                offset: offset,
                orderBy: (transfers, { desc }) => [desc(transfers.createdAt)],
            });
            return { success: true, data: transfers };
        },
        [`internal-transfers-${tenantId}-${limit}-${offset}`],
        {
            tags: [`finance-transfer-${tenantId}`],
            revalidate: 60,
        }
    )();
}

/**
 * 取消/冲销资金调拨 (Cancel Internal Transfer)
 * 
 * 对已完成的调拨单进行红字冲销操作以恢复账户余额，逻辑包括：
 * 1. 验证调拨单处于 COMPLETED 状态，并尝试利用 `CANCELLING` 状态行锁实现幂等性更新 (F-30)
 * 2. 检查目标账户当前余额是否足以支撑反向扣减操作
 * 3. 将原转出账户余额加回，并生成反向收入流水 (REV-IN)
 * 4. 将原转入账户余额扣减，并生成反向支出流水 (REV-OUT)
 * 5. 记录状态更新审计日志并把调拨单状态置为 CANCELLED
 * 
 * @param {string} transferId - 需要冲销的调拨单 ID
 * @param {string} [reason] - 可选的冲销原因
 * @returns 返回冲销操作结果和相关金额
 * @throws {Error} 未授权或缺少财务管理权限时返回错误对象
 */
export async function cancelInternalTransfer(transferId: string, reason?: string) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;

        // 权限检查：需要财务管理权限
        if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) {
            return { success: false, error: '权限不足：需要财务管理权限' };
        }

        logger.info('[finance] 取消内部调拨', { transferId, reason });

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
                return { success: false, error: '调拨单状态不可冲销（可能已冲销或非完成状态）' };
            }

            // F-30: 幂等性保护 - 尝试原子更新状态为 CANCELLING
            const [lockedTransfer] = await tx.update(internalTransfers)
                .set({ status: 'CANCELLING', updatedAt: new Date() })
                .where(and(
                    eq(internalTransfers.id, transferId),
                    eq(internalTransfers.tenantId, tenantId),
                    eq(internalTransfers.status, 'COMPLETED')
                ))
                .returning();

            if (!lockedTransfer) {
                return { success: false, error: '调拨单已被锁定或状态已变更' };
            }

            const amount = new Decimal(transfer.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

            // 2. 获取当前账户余额
            const fromAccount = await tx.query.financeAccounts.findFirst({
                where: and(
                    eq(financeAccounts.id, transfer.fromAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                )
            });
            const toAccount = await tx.query.financeAccounts.findFirst({
                where: and(
                    eq(financeAccounts.id, transfer.toAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                )
            });

            if (!fromAccount || !toAccount) {
                return { success: false, error: '关联账户不存在' };
            }

            const fromBalance = new Decimal(fromAccount.balance || '0');
            const toBalance = new Decimal(toAccount.balance || '0');

            // 检查目标账户余额是否足够冲销
            if (toBalance.lt(amount)) {
                // 恢复状态并报错
                await tx.update(internalTransfers).set({ status: 'COMPLETED' }).where(eq(internalTransfers.id, transferId));
                return { success: false, error: `目标账户余额不足，无法冲销。当前余额: ¥${toBalance.toFixed(2, Decimal.ROUND_HALF_UP)}` };
            }

            // 3. 恢复源账户余额（加回）
            const fromNewBalance = fromBalance.plus(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            await tx.update(financeAccounts)
                .set({
                    balance: fromNewBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                    updatedAt: new Date()
                })
                .where(and(
                    eq(financeAccounts.id, transfer.fromAccountId),
                    eq(financeAccounts.tenantId, tenantId)
                ));


            // 4. 扣减目标账户余额
            const toNewBalance = toBalance.minus(amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            await tx.update(financeAccounts)
                .set({
                    balance: toNewBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                    updatedAt: new Date()
                })
                .where(and(
                    eq(financeAccounts.id, transfer.toAccountId),
                    eq(financeAccounts.tenantId, tenantId),
                    eq(financeAccounts.balance, toBalance.toFixed(2, Decimal.ROUND_HALF_UP)) // 乐观锁
                ));


            // 5. 创建冲销流水 - 源账户收入
            await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateBusinessNo('REV-IN'),
                accountId: transfer.fromAccountId,
                transactionType: 'INCOME',
                amount: amount.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceBefore: fromBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceAfter: fromBalance.plus(amount).toFixed(2, Decimal.ROUND_HALF_UP),
                relatedType: 'TRANSFER_REVERSAL',
                relatedId: transfer.id,
                remark: `冲销调拨: ${transfer.transferNo}${reason ? ` (${reason})` : ''}`,
            });

            // 6. 创建冲销流水 - 目标账户支出
            await tx.insert(accountTransactions).values({
                tenantId,
                transactionNo: generateBusinessNo('REV-OUT'),
                accountId: transfer.toAccountId,
                transactionType: 'EXPENSE',
                amount: amount.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceBefore: toBalance.toFixed(2, Decimal.ROUND_HALF_UP),
                balanceAfter: toBalance.minus(amount).toFixed(2, Decimal.ROUND_HALF_UP),
                relatedType: 'TRANSFER_REVERSAL',
                relatedId: transfer.id,
                remark: `冲销调拨: ${transfer.transferNo}${reason ? ` (${reason})` : ''}`,
            });

            // 审计日志 F-32
            await AuditService.log(tx, {
                tenantId,
                userId: session.user.id!,
                tableName: 'internal_transfers',
                recordId: transfer.id,
                action: 'UPDATE', // 此操作属于更新状态
                newValues: { status: 'CANCELLED', reason },
                oldValues: { status: 'COMPLETED' },
                details: { transferNo: transfer.transferNo, amount: amount.toFixed(2, Decimal.ROUND_HALF_UP) }
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

            revalidateTag(`finance-transfer-${tenantId}`, 'default');
            revalidateTag(`finance-transfer-detail-${transfer.id}`, 'default');

            logger.info('[finance] cancelInternalTransfer 执行成功', { transferNo: transfer.transferNo });

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
        logger.info('[finance] 取消调拨失败', { error, transferId });
        logger.error('冲销调拨失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '冲销失败'
        };
    }
}

/**
 * 获取单条资金调拨单详情 (Get Internal Transfer Details)
 * 
 * 根据调拨单 ID 查询完整的调拨明细数据，包含关联的源账户、目标账户以及创建和审批人信息。
 * 
 * @param {string} id - 调拨单的一级主键 ID
 * @returns 返回包含详细数据的调拨单详情
 * @throws {Error} 未授权或缺少财务查看权限时返回错误对象
 */
export async function getInternalTransfer(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }
    const tenantId = session.user.tenantId;

    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) {
        return { success: false, error: '权限不足：需要财务查看权限' };
    }

    return unstable_cache(
        async () => {
            logger.info('[finance] [CACHE_MISS] ', { id, tenantId });
            const transfer = await db.query.internalTransfers.findFirst({
                where: and(
                    eq(internalTransfers.id, id),
                    eq(internalTransfers.tenantId, tenantId)
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
        },
        [`internal-transfer-detail-${id}`],
        {
            tags: [`finance-transfer-detail-${id}`],
            revalidate: 60,
        }
    )();
}
