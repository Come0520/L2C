'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { format } from 'date-fns';
import { logger } from '@/shared/lib/logger';

/**
 * 导出订单数据 Action
 * 
 * 核心逻辑：查询当前租户下的订单数据，并将其转换为 CSV 格式输出。
 * 性能优化：限制查询条数，仅加载必要关联数据。
 * 
 * @param _filters 过滤条件的记录对象，用于拓展复杂的导出条件筛选
 * @returns 包含操作结果、CSV 字符串内容以及文件名的对象
 */
export async function exportOrdersAction(_filters: Record<string, unknown>) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

        await checkPermission(session, PERMISSIONS.ORDER.VIEW);

        // 模拟复杂筛选条件下的查询
        const data = await db.query.orders.findMany({
            where: eq(orders.tenantId, session.user.tenantId),
            with: {
                customer: {
                    columns: { name: true }
                }
            },
            orderBy: [desc(orders.createdAt)],
            limit: 1000, // 限制导出上限以保证性能，后续可升级为流式
        });

        // 转换为 CSV 格式字节流或字符串
        const headers = ['订单号', '客户', '金额', '状态', '创建时间'];
        const rows = data.map(o => [
            o.orderNo,
            o.customer?.name || '-',
            o.totalAmount,
            o.status,
            o.createdAt ? format(o.createdAt, 'yyyy-MM-dd HH:mm') : '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        logger.info('[orders] 导出订单成功:', { tenantId: session.user.tenantId, rowCount: rows.length });

        return {
            success: true,
            data: csvContent,
            filename: `orders_export_${format(new Date(), 'yyyyMMdd')}.csv`
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Export failed';
        logger.error('[orders] 导出订单失败:', { error });
        return { success: false, error: message };
    }
}
