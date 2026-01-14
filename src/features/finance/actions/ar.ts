'use server';

import { db } from '@/shared/api/db';
import {
    arStatements,
} from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { FinanceService } from '@/services/finance.service';
// auth imported above
import { createPaymentOrderSchema, verifyPaymentOrderSchema } from './schema';
import { z } from 'zod';

/**
 * 获取应收对账单列表
 */
export async function getARStatements() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.arStatements.findMany({
        where: eq(arStatements.tenantId, session.user.tenantId),
        with: {
            order: true,
            customer: true,
        },
        orderBy: [desc(arStatements.createdAt)],
    });
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

    const validatedData = createPaymentOrderSchema.parse(data);
    const { items, ...orderData } = validatedData;

    // Convert to service format
    const serviceData: any = {
        ...orderData,
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

    const { id, status, remark } = verifyPaymentOrderSchema.parse(data);

    return await FinanceService.verifyPaymentOrder(id, status as any, session.user.tenantId, session.user.id!, remark);
}

// calculateCommission moved to FinanceService
