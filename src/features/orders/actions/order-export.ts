'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { format } from 'date-fns';

/**
 * 导出订单数据（性能优化：仅查询必要字段，支持大规模导出预备）
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

        return {
            success: true,
            data: csvContent,
            filename: `orders_export_${format(new Date(), 'yyyyMMdd')}.csv`
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Export failed';
        return { success: false, error: message };
    }
}
