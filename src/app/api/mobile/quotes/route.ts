/**
 * 销售端 - 报价列表 API
 * GET /api/mobile/quotes
 * 
 * 销售人员查看自己创建的报价单列表，支持分页和关键词搜索。
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema';
import { eq, and, desc, like, or, sql, isNull } from 'drizzle-orm';
import { apiPaginated, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';


const log = createLogger('mobile/quotes');
export async function GET(request: NextRequest) {
    // 1. 认证
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;
    const session = auth.session;

    // 2. 权限检查 — 仅销售角色
    const roleCheck = requireSales(session);
    if (!roleCheck.allowed) return roleCheck.response;

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const keyword = searchParams.get('keyword')?.trim() || '';
    const status = searchParams.get('status') || '';

    try {
        // 4. 构建基础查询条件
        const conditions = [
            eq(quotes.tenantId, session.tenantId),
            eq(quotes.createdBy, session.userId),
            eq(quotes.isActive, true),      // 只查活跃版本
            isNull(quotes.deletedAt),        // 排除已删除
        ];

        // 状态筛选
        if (status) {
            conditions.push(sql`${quotes.status} = ${status}`);
        }

        // 关键词搜索（模糊匹配报价编号和标题）
        if (keyword) {
            conditions.push(
                or(
                    like(quotes.quoteNo, `%${keyword}%`),
                    like(quotes.title, `%${keyword}%`)
                )!
            );
        }

        const whereClause = and(...conditions);

        // 5. 查询总数
        const countResult = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(quotes)
            .where(whereClause);
        const total = countResult[0]?.count ?? 0;

        // 6. 查询列表
        const quoteList = await db.query.quotes.findMany({
            where: whereClause,
            columns: {
                id: true,
                quoteNo: true,
                title: true,
                totalAmount: true,
                finalAmount: true,
                status: true,
                version: true,
                validUntil: true,
                createdAt: true,
            },
            with: {
                customer: {
                    columns: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
            },
            orderBy: [desc(quotes.createdAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });

        // 7. 格式化返回数据
        const items = quoteList.map((q) => ({
            id: q.id,
            quoteNo: q.quoteNo,
            title: q.title || `报价单 ${q.quoteNo}`,
            customerName: q.customer?.name || '未知客户',
            customerPhone: q.customer?.phone || '',
            totalAmount: q.totalAmount ? parseFloat(q.totalAmount) : 0,
            finalAmount: q.finalAmount ? parseFloat(q.finalAmount) : 0,
            status: q.status,
            statusText: getStatusText(q.status),
            version: q.version,
            validUntil: q.validUntil,
            createdAt: q.createdAt,
        }));

        return apiPaginated(items, page, pageSize, total);
    } catch (error) {
        log.error('[Mobile API][quotes] 报价列表查询错误', { error, userId: session.userId });
        return apiError('查询报价列表失败', 500);
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
