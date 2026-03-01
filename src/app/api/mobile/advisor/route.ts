/**
 * 客户端 - 专属顾问信息 API
 * GET /api/mobile/advisor
 *
 * 返回当前客户所关联的销售顾问的基本信息（姓名、头像、电话），
 * 供小程序首页"您的专属顾问"卡片展示。
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/advisor');

export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查：仅客户角色可访问
    const roleCheck = requireCustomer(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    try {
        // 3. 查询当前客户的 assignedSalesId
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, session.userId),
            columns: {
                assignedSalesId: true,
            },
        });

        if (!customer?.assignedSalesId) {
            // 客户存在但尚未分配销售顾问
            return apiSuccess(null, '暂未分配专属顾问');
        }

        // 4. 查询销售顾问信息
        const advisor = await db.query.users.findFirst({
            where: eq(users.id, customer.assignedSalesId),
            columns: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
            },
        });

        if (!advisor) {
            log.warn(`客户 ${session.userId} 的 assignedSalesId(${customer.assignedSalesId}) 对应用户不存在`);
            return apiSuccess(null, '顾问信息异常');
        }

        return apiSuccess({
            name: advisor.name || '销售顾问',
            phone: advisor.phone,
            avatarUrl: advisor.avatarUrl || null,
        });

    } catch (error) {
        log.error('查询顾问信息失败', { customerId: session.userId }, error);
        return apiError('查询顾问信息失败', 500);
    }
}
