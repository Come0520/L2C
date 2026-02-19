'use server';

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
 * 获取应收对账单列表
 * 
 * 注：使用标准 select 查询替代 relational query API，
 * 以避免 Drizzle ORM 0.45.x lateral join 兼容性问题
 */
export async function getARStatements() {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) throw new Error('未授权');

        // 权限检查：查看应收数据
        if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

        // 直接查询 arStatements，不使用 relational query，避免 lateral join 问题
        const result = await db
            .select()
            .from(arStatements)
            .where(eq(arStatements.tenantId, session.user.tenantId))
            .orderBy(desc(arStatements.createdAt));

        return result;
    } catch (error) {
        console.error('❌ getARStatements Error:', error);
        throw error;
    }
}

/**
 * 获取单条应收对账单详情
 */
export async function getARStatement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.arStatements.findFirst({
        where: and(
            eq(arStatements.id, id),
            eq(arStatements.tenantId, session.user.tenantId)
        ),
        with: {
            order: true,
            customer: true,
            channel: true,
            commissionRecords: true,
        }
    });
}

/**
 * 创建收款单
 */
export async function createPaymentOrder(data: z.infer<typeof createPaymentOrderSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：创建收付款
    if (!await checkPermission(session, PERMISSIONS.FINANCE.CREATE)) throw new Error('权限不足：需要财务创建权限');

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

    return await FinanceService.createPaymentOrder(serviceData, session.user.tenantId, session.user.id!);
}

export async function verifyPaymentOrder(data: z.infer<typeof verifyPaymentOrderSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：审批财务
    if (!await checkPermission(session, PERMISSIONS.FINANCE.APPROVE)) throw new Error('权限不足：需要财务审批权限');

    const { id, status, remark } = verifyPaymentOrderSchema.parse(data);

    // 类型安全：Schema 定义 status 为 'VERIFIED' | 'REJECTED'，与服务层一致
    return await FinanceService.verifyPaymentOrder(
        id,
        status,
        session.user.tenantId,
        session.user.id!,
        remark
    );
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
        console.error('创建退款对账单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

