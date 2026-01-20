/**
 * 采购端 - 待采购池 API
 * GET /api/mobile/purchase/pending-pool
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { purchaseOrders } from '@/shared/api/schema';
import { eq, and, or } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
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
    const supplierId = searchParams.get('supplierId');

    try {
        // 4. 查询待采购的采购单
        const conditions = [
            eq(purchaseOrders.tenantId, session.tenantId),
            or(
                eq(purchaseOrders.status, 'DRAFT'),
                eq(purchaseOrders.status, 'PENDING')
            )
        ];

        if (supplierId) {
            conditions.push(eq(purchaseOrders.supplierId, supplierId));
        }

        const pendingPOs = await db.query.purchaseOrders.findMany({
            where: and(...conditions),
            with: {
                supplier: {
                    columns: { name: true }
                },
                items: {
                    columns: {
                        productName: true,
                        quantity: true,
                        unitPrice: true,
                    }
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

        // 5. 按产品分组统计
        const productSummary: Record<string, { name: string; totalQty: number; orders: number }> = {};

        pendingPOs.forEach(po => {
            po.items?.forEach(item => {
                const key = item.productName || 'unknown';
                if (!productSummary[key]) {
                    productSummary[key] = { name: key, totalQty: 0, orders: 0 };
                }
                productSummary[key].totalQty += Number(item.quantity) || 0;
                productSummary[key].orders += 1;
            });
        });

        // 6. 格式化响应
        const items = pendingPOs.map(po => ({
            id: po.id,
            poNo: po.poNo,
            status: po.status,
            supplierName: po.supplier?.name || '未知供应商',
            itemCount: po.items?.length || 0,
            totalAmount: po.totalAmount ? parseFloat(String(po.totalAmount)) : 0,
            createdAt: po.createdAt?.toISOString(),
        }));

        return apiSuccess({
            orders: items,
            total: items.length,
            productSummary: Object.values(productSummary),
        });

    } catch (error) {
        console.error('待采购池查询错误:', error);
        return apiError('查询待采购池失败', 500);
    }
}
