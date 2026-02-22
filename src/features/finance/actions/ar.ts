'use server';
import { unstable_cache, revalidateTag } from 'next/cache';
import { logger } from "@/shared/lib/logger";

import { db } from '@/shared/api/db';
import {
    arStatements,
} from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { FinanceService } from '@/services/finance.service';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { createPaymentOrderSchema, verifyPaymentOrderSchema } from './schema';
import { z } from 'zod';
import { handleCommissionClawback } from '@/features/channels/logic/commission.service';
import { Decimal } from 'decimal.js';
import { AuditService } from '@/shared/services/audit-service';
import { generateBusinessNo } from '@/shared/lib/generate-no';

/**
 * 获取应收对账单列表 (Get Accounts Receivable Statements)
 * 
 * 获取当前租户下所有的应收对账单，按创建时间倒序排列。
 * 增加了 limit/offset 分页查询支持以防止查询过多导致 OOM。
 * 
 * 注：使用标准 select 查询替代 relational query API，
 * 以避免 Drizzle ORM 0.45.x lateral join 兼容性问题
 * 
 * @param params `{ limit?: number, offset?: number }` 期望查阅的数据条目上限和游标跳过数量。
 * @returns {Promise<Array<typeof arStatements.$inferSelect>>} 应收对账单列表
 * @throws {Error} 未授权或权限不足时抛出错误
 */
export async function getARStatements(params?: { limit?: number; offset?: number }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            console.log('[finance] [CACHE_MISS] 获取应收对账单列表', { tenantId, limit, offset });
            return await db
                .select()
                .from(arStatements)
                .where(eq(arStatements.tenantId, tenantId))
                .orderBy(desc(arStatements.createdAt))
                .limit(limit)
                .offset(offset);
        },
        [`ar-statements-${tenantId}-${limit}-${offset}`],
        {
            tags: [`finance-ar-${tenantId}`],
            revalidate: 60,
        }
    )();
}

/**
 * 获取单条应收对账单详情 (Get Accounts Receivable Statement Details)
 * 
 * 根据对账单 ID 查询详细信息，包含关联的订单、客户、渠道及佣金记录。
 * 
 * @param {string} id - 对账单的一级主键 ID
 * @returns {Promise<ARStatementWithRelations | null>} 对账单详细信息（包含关系数据），未找到则返回 null
 * @throws {Error} 未授权时抛出错误
 */
export async function getARStatement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            console.log('[finance] [CACHE_MISS] 获取单条应收对账单详情', { id, tenantId });
            return await db.query.arStatements.findFirst({
                where: and(
                    eq(arStatements.id, id),
                    eq(arStatements.tenantId, tenantId)
                ),
                with: {
                    order: true,
                    customer: true,
                    channel: true,
                    commissionRecords: true,
                }
            });
        },
        [`ar-statement-${id}`],
        {
            tags: [`finance-ar-detail-${id}`],
            revalidate: 60,
        }
    )();
}

/**
 * 创建收款单 (Create Payment Order)
 * 
 * 财务人员根据客户的付款凭证创建收款单，并可关联相应的明细项。
 * 委托 `FinanceService.createPaymentOrder` 核心方法完成业务操作。
 * 
 * @param {z.infer<typeof createPaymentOrderSchema>} data - 收款单的有效数据
 * @returns 返回服务层创建收款单的结果
 * @throws {Error} 未授权或缺少财务创建权限时抛出错误
 */
export async function createPaymentOrder(data: z.infer<typeof createPaymentOrderSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：创建收付款
    if (!await checkPermission(session, PERMISSIONS.FINANCE.CREATE)) throw new Error('权限不足：需要财务创建权限');

    console.log('[finance] 创建收款单', { data });

    const validatedData = createPaymentOrderSchema.parse(data);
    const { items, ...orderData } = validatedData;

    // 转换为服务层格式，显式构建符合 CreatePaymentOrderData 接口的对象
    const serviceData: Parameters<typeof FinanceService.createPaymentOrder>[0] = {
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        totalAmount: String(orderData.totalAmount),
        type: orderData.type,
        paymentMethod: orderData.paymentMethod,
        accountId: orderData.accountId,
        proofUrl: orderData.proofUrl,
        receivedAt: orderData.receivedAt,
        remark: orderData.remark,
        items: items?.map(item => ({
            orderId: item.orderId,
            amount: item.amount
        }))
    };

    const result = await FinanceService.createPaymentOrder(serviceData, session.user.tenantId, session.user.id!);
    revalidateTag(`finance-ar-${session.user.tenantId}`);
    console.log('[finance] createPaymentOrder 执行成功', { serviceData });
    return result;
}

/**
 * 审核收款单 (Verify Payment Order)
 * 
 * 财务人员对已创建的收款单进行审核确认（通过或驳回）。
 * 委托 `FinanceService.verifyPaymentOrder` 核心方法处理底层事务状态扭转。
 * 
 * @param {z.infer<typeof verifyPaymentOrderSchema>} data - 审核数据，包含收款单 ID、审核状态（VERIFIED | REJECTED）和可选备注
 * @returns 返回服务层审核结果
 * @throws {Error} 未授权或缺少财务审批权限时抛出错误
 */
export async function verifyPaymentOrder(data: z.infer<typeof verifyPaymentOrderSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：审批财务
    if (!await checkPermission(session, PERMISSIONS.FINANCE.APPROVE)) throw new Error('权限不足：需要财务审批权限');

    console.log('[finance] 审核收款单', { data });

    const { id, status, remark } = verifyPaymentOrderSchema.parse(data);

    // 类型安全：Schema 定义 status 为 'VERIFIED' | 'REJECTED'，与服务层一致
    const result = await FinanceService.verifyPaymentOrder(
        id,
        status,
        session.user.tenantId,
        session.user.id!,
        remark
    );
    revalidateTag(`finance-ar-${session.user.tenantId}`);
    revalidateTag(`finance-ar-detail-${id}`);
    console.log('[finance] verifyPaymentOrder 执行成功', { id, status });
    return result;
}

// calculateCommission moved to FinanceService
// export * from './receipt'; // Removed to avoid re-export issues

// ==================== 客户退款流程 (Customer Refund) ====================

const createRefundSchema = z.object({
    originalStatementId: z.string().uuid('请选择原对账单'),
    refundAmount: z.number().positive('退款金额必须大于0'),
    reason: z.string().min(1, '请填写退款原因'),
    remark: z.string().optional(),
});

/**
 * 创建退款对账单（红字 AR）
 * 
 * 逻辑：
 * 1. 验证原对账单存在且已收款
 * 2. 验证退款金额不超过已收金额
 * 3. 创建红字 AR 对账单（负数金额）
 * 4. 更新原对账单状态
 */
export async function createRefundStatement(input: z.infer<typeof createRefundSchema>) {
    try {
        const data = createRefundSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        // 权限检查：创建收付款
        if (!await checkPermission(session, PERMISSIONS.FINANCE.CREATE)) {
            return { success: false, error: '权限不足：需要财务创建权限' };
        }

        const tenantId = session.user.tenantId;
        const _userId = session.user.id!;

        console.log('[finance] 创建退款对账单', { input });

        return await db.transaction(async (tx) => {
            // 1. 获取原对账单
            const originalStatement = await tx.query.arStatements.findFirst({
                where: and(
                    eq(arStatements.id, data.originalStatementId),
                    eq(arStatements.tenantId, tenantId)
                ),
                with: {
                    order: true,
                    customer: true,
                }
            });

            if (!originalStatement) {
                return { success: false, error: '原对账单不存在' };
            }

            const totalAmount = new Decimal(originalStatement.totalAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const receivedAmount = new Decimal(originalStatement.receivedAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const refundAmount = new Decimal(data.refundAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

            if (receivedAmount.lte(0)) {
                return { success: false, error: '原对账单未收款，无法退款' };
            }

            if (refundAmount.gt(receivedAmount)) {
                return { success: false, error: `退款金额不能超过已收金额 ¥${receivedAmount.toFixed(2)}` };
            }

            // 2. 生成红字对账单编号
            const refundNo = generateBusinessNo('AR-RF');

            // 3. 创建红字 AR 对账单（负数金额）
            const [refundStatement] = await tx.insert(arStatements).values({
                tenantId,
                statementNo: refundNo,
                orderId: originalStatement.orderId,
                customerId: originalStatement.customerId,
                customerName: originalStatement.customerName,
                settlementType: originalStatement.settlementType,

                // 负数金额表示红字
                totalAmount: refundAmount.negated().toFixed(2),
                receivedAmount: refundAmount.negated().toFixed(2), // 已退
                pendingAmount: '0',

                status: 'COMPLETED', // 红字单直接完成

                salesId: originalStatement.salesId,
                channelId: originalStatement.channelId,
            }).returning();

            // 4. 更新原对账单已收金额
            const newReceivedAmount = receivedAmount.minus(refundAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const newPendingAmount = totalAmount.minus(newReceivedAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const newStatus = (newReceivedAmount.gte(totalAmount) ? 'PAID' : (newReceivedAmount.gt(0) ? 'PARTIAL' : 'INVOICED')) as "PAID" | "PARTIAL" | "INVOICED";



            const oldValues = {
                receivedAmount: originalStatement.receivedAmount,
                pendingAmount: originalStatement.pendingAmount,
                status: originalStatement.status
            };

            const newValues = {
                receivedAmount: newReceivedAmount.toFixed(2),
                pendingAmount: newPendingAmount.toFixed(2),
                status: newStatus

            };

            await tx.update(arStatements)
                .set(newValues)
                .where(eq(arStatements.id, data.originalStatementId));

            // F-32: 记录原对账单状态变动审计
            await AuditService.log(tx, {
                tenantId,
                userId: session.user.id,
                tableName: 'ar_statements',
                recordId: originalStatement.id,
                action: 'UPDATE',
                oldValues,
                newValues,
                details: {
                    reason: 'REFUND_CLAWBACK',
                    refundNo,
                    refundAmount: refundAmount.toFixed(2)
                }
            });

            // 记录退款单审计
            await AuditService.log(tx, {
                tenantId,
                userId: session.user.id,
                tableName: 'ar_statements',
                recordId: refundStatement.id,
                action: 'CREATE',
                newValues: refundStatement,
                details: {
                    type: 'REFUND',
                    originalStatementNo: originalStatement.statementNo
                }
            });

            // 5. 触发佣金扣回（如果原对账单有渠道佣金）
            if (originalStatement.channelId && originalStatement.orderId) {
                await handleCommissionClawback(
                    originalStatement.orderId,
                    data.refundAmount
                );
            }

            revalidateTag(`finance-ar-${tenantId}`);
            revalidateTag(`finance-ar-detail-${originalStatement.id}`);
            console.log('[finance] createRefundStatement 执行成功', { refundNo });

            return {
                success: true,
                data: {
                    refundStatementId: refundStatement.id,
                    refundNo,
                    refundAmount: refundAmount.toNumber(),
                    originalStatementNo: originalStatement.statementNo,
                    message: '退款对账单创建成功'
                }
            };

        });
    } catch (error) {
        console.log('[finance] 创建退款对账单失败', { error, input });
        logger.error('创建退款对账单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

