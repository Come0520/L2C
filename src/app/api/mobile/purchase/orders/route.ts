/**
 * 采购端 - 采购单列表 & 物流状态 API
 * GET /api/mobile/purchase/orders
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { purchaseOrders } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';
import { apiError, apiPaginated } from '@/shared/lib/api-response';
import { authenticateMobile, requirePurchaser } from '@/shared/middleware/mobile-auth';

export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requirePurchaser(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');

    try {
        // 4. 构建查询条件
        // 使用 and() 组合多个条件
        const baseCondition = eq(purchaseOrders.tenantId, session.tenantId);
        const whereCondition = status
            ? and(baseCondition, eq(purchaseOrders.status, status))
            : baseCondition;

        // 5. 查询采购单
        const pos = await db.query.purchaseOrders.findMany({
            where: whereCondition,
            orderBy: [desc(purchaseOrders.createdAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            with: {
                supplier: {
                    columns: { name: true }
                }
            },
            columns: {
                id: true,
                poNo: true,
                status: true,
                totalAmount: true,
                createdAt: true,
            }
        });

        // 6. 统计总数
        const allPOs = await db.query.purchaseOrders.findMany({
            where: baseCondition,
            columns: { id: true }
        });
        const total = allPOs.length;

        // 7. 格式化响应
        const items = pos.map(po => ({
            id: po.id,
            poNo: po.poNo,
            status: po.status,
            statusText: getStatusText(po.status),
            supplierName: po.supplier?.name || '未知供应商',
            totalAmount: po.totalAmount ? parseFloat(String(po.totalAmount)) : 0,
            createdAt: po.createdAt?.toISOString(),
            // 物流进度节点
            logisticsProgress: buildLogisticsProgress(po.status),
        }));

        return apiPaginated(items, page, pageSize, total);

    } catch (error) {
        console.error('采购单列表查询错误:', error);
        return apiError('查询采购单列表失败', 500);
    }
}

function getStatusText(status: string | null): string {
    const map: Record<string, string> = {
        'DRAFT': '草稿',
        'PENDING': '待确认',
        'CONFIRMED': '已确认',
        'IN_PRODUCTION': '生产中',
        'SHIPPED': '已发货',
        'RECEIVED': '已签收',
        'COMPLETED': '已完成',
    };
    return map[status || ''] || status || '';
}

function buildLogisticsProgress(status: string | null) {
    const steps = [
        { step: 1, name: '已下单', completed: true },
        { step: 2, name: '生产中', completed: ['IN_PRODUCTION', 'SHIPPED', 'RECEIVED', 'COMPLETED'].includes(status || '') },
        { step: 3, name: '已发货', completed: ['SHIPPED', 'RECEIVED', 'COMPLETED'].includes(status || '') },
        { step: 4, name: '运输中', completed: ['RECEIVED', 'COMPLETED'].includes(status || '') },
        { step: 5, name: '已签收', completed: ['RECEIVED', 'COMPLETED'].includes(status || '') },
    ];
    return steps;
}
