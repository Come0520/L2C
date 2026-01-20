/**
 * 销售端 - 客户列表 API
 * GET /api/mobile/leads
 * 
 * 支持查询：我的客户 / 公海客户
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and, isNull, desc, or, ilike } from 'drizzle-orm';
import { apiError, apiPaginated } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadStatusMap, getStatusText } from '@/shared/lib/status-maps';

export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireSales(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'mine';  // mine | pool
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword');

    try {
        // 4. 构建查询条件
        const baseConditions = [eq(leads.tenantId, session.tenantId)];

        if (type === 'mine') {
            // 我的客户：已分配给当前销售
            baseConditions.push(eq(leads.assignedSalesId, session.userId));
        } else if (type === 'pool') {
            // 公海客户：未分配
            baseConditions.push(isNull(leads.assignedSalesId));
        }

        // 关键词搜索
        if (keyword) {
            baseConditions.push(
                or(
                    ilike(leads.customerName, `%${keyword}%`),
                    ilike(leads.customerPhone, `%${keyword}%`)
                )!
            );
        }

        // 5. 查询数据
        const leadList = await db.query.leads.findMany({
            where: and(...baseConditions),
            orderBy: [desc(leads.updatedAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            columns: {
                id: true,
                leadNo: true,
                customerName: true,
                customerPhone: true,
                address: true,
                status: true,
                intentionLevel: true,
                lastActivityAt: true,
                nextFollowupAt: true,
                decorationProgress: true,
                createdAt: true,
            }
        });

        // 6. 统计总数
        const allLeads = await db.query.leads.findMany({
            where: and(...baseConditions),
            columns: { id: true }
        });
        const total = allLeads.length;

        // 7. 格式化响应
        const items = leadList.map(lead => ({
            id: lead.id,
            leadNo: lead.leadNo,
            name: lead.customerName,
            phone: maskPhone(lead.customerPhone),
            address: lead.address,
            status: lead.status,
            statusText: getStatusText(LeadStatusMap, lead.status),
            intentionLevel: lead.intentionLevel,
            lastActivityAt: lead.lastActivityAt?.toISOString(),
            nextFollowupAt: lead.nextFollowupAt?.toISOString(),
            decorationProgress: lead.decorationProgress,
            createdAt: lead.createdAt?.toISOString(),
        }));

        return apiPaginated(items, page, pageSize, total);

    } catch (error) {
        console.error('客户列表查询错误:', error);
        return apiError('查询客户列表失败', 500);
    }
}

/**
 * 手机号脱敏
 */
function maskPhone(phone: string | null): string {
    if (!phone || phone.length < 7) return phone || '';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
}
