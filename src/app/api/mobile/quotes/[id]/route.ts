/**
 * 销售端 - 报价详情 API
 * GET /api/mobile/quotes/:id
 * 
 * 查看报价单详情，包含报价项列表（隐藏成本价）。
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/quotes/[id]');

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    // 1. 认证
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;
    const session = auth.session;

    // 2. 权限检查 — 仅销售角色
    const roleCheck = requireSales(session);
    if (!roleCheck.allowed) return roleCheck.response;

    // 3. 获取路径参数
    const params = await props.params;
    const quoteId = params.id;

    try {
        // 4. 查询报价单详情（含报价项和客户信息）
        const quote = await db.query.quotes.findFirst({
            where: and(
                eq(quotes.id, quoteId),
                eq(quotes.tenantId, session.tenantId),
                eq(quotes.createdBy, session.userId),
                isNull(quotes.deletedAt)
            ),
            with: {
                customer: {
                    columns: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                rooms: {
                    columns: {
                        id: true,
                        name: true,
                        sortOrder: true,
                    },
                },
                items: {
                    columns: {
                        id: true,
                        category: true,
                        productName: true,
                        productSku: true,
                        roomName: true,
                        unit: true,
                        unitPrice: true,
                        // 注意：不返回 costPrice（成本价），保护公司利润结构
                        quantity: true,
                        width: true,
                        height: true,
                        foldRatio: true,
                        processFee: true,
                        subtotal: true,
                        attributes: true,
                        remark: true,
                        sortOrder: true,
                    },
                },
            },
        });

        if (!quote) {
            return apiNotFound('报价单不存在或无权访问');
        }

        // 5. 格式化返回数据
        const result = {
            id: quote.id,
            quoteNo: quote.quoteNo,
            title: quote.title || `报价单 ${quote.quoteNo}`,
            status: quote.status,
            statusText: getStatusText(quote.status),
            version: quote.version,

            // 金额信息
            totalAmount: quote.totalAmount ? parseFloat(quote.totalAmount) : 0,
            discountRate: quote.discountRate ? parseFloat(quote.discountRate) : null,
            discountAmount: quote.discountAmount ? parseFloat(quote.discountAmount) : 0,
            finalAmount: quote.finalAmount ? parseFloat(quote.finalAmount) : 0,

            // 客户信息
            customer: quote.customer ? {
                id: quote.customer.id,
                name: quote.customer.name,
                phone: quote.customer.phone,
            } : null,

            // 审批信息
            approvalRequired: quote.approvalRequired,
            approvedAt: quote.approvedAt,
            rejectReason: quote.rejectReason,

            // 确认信息
            confirmedAt: quote.confirmedAt,
            customerSignatureUrl: quote.customerSignatureUrl,

            // 有效期
            validUntil: quote.validUntil,
            notes: quote.notes,

            // 空间列表
            rooms: (quote.rooms || []).map((room) => ({
                id: room.id,
                name: room.name,
                sortOrder: room.sortOrder,
            })),

            // 报价项列表（隐藏成本价）
            items: (quote.items || []).map((item) => ({
                id: item.id,
                category: item.category,
                productName: item.productName,
                productSku: item.productSku,
                roomName: item.roomName,
                unit: item.unit,
                unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : 0,
                quantity: item.quantity ? parseFloat(item.quantity) : 0,
                width: item.width ? parseFloat(item.width) : null,
                height: item.height ? parseFloat(item.height) : null,
                foldRatio: item.foldRatio ? parseFloat(item.foldRatio) : null,
                processFee: item.processFee ? parseFloat(item.processFee) : null,
                subtotal: item.subtotal ? parseFloat(item.subtotal) : 0,
                attributes: item.attributes,
                remark: item.remark,
                sortOrder: item.sortOrder,
            })),

            // 时间戳
            createdAt: quote.createdAt,
            updatedAt: quote.updatedAt,
        };

        return apiSuccess(result);
    } catch (error) {
        log.error('报价详情查询错误', { userId: session.userId, quoteId }, error);
        return apiError('查询报价详情失败', 500);
    }
}

/**
 * 报价状态文本映射
 */
function getStatusText(status: string | null): string {
    const map: Record<string, string> = {
        'DRAFT': '草稿',
        'PENDING_APPROVAL': '待审批',
        'APPROVED': '已审批',
        'REJECTED': '已驳回',
        'SENT': '已发送',
        'CONFIRMED': '客户已确认',
        'EXPIRED': '已过期',
        'CANCELLED': '已取消',
    };
    return map[status || ''] || status || '未知';
}
