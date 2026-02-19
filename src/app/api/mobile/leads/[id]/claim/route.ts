/**
 * 销售端 - 领取客户 API
 * POST /api/mobile/leads/:id/claim
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { z } from 'zod';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/leads/[id]/claim');

interface ClaimParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: ClaimParams) {
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

    const { id: leadId } = await params;

    if (!z.string().uuid().safeParse(leadId).success) {
        return apiError('无效的线索ID', 400);
    }

    try {
        // 3. 调用 Service 领取客户 (包含 FOR UPDATE 锁和状态检查)
        // 注意：claimFromPool 返回的是更新后的 lead 对象
        const result = await LeadService.claimFromPool(leadId, session.tenantId, session.userId);

        log.info(`客户领取: 销售 ${session.userId} 领取客户 (ID masked)`);

        return apiSuccess(
            {
                leadId,
                customerName: result.customerName,
                assignedTo: session.userId,
                assignedAt: result.assignedAt?.toISOString(),
            },
            '客户领取成功'
        );

    } catch (error: unknown) {
        log.error('客户领取错误', {}, error);

        const message = error instanceof Error ? error.message : '领取客户失败';

        if (message === 'Lead not found or access denied') {
            return apiNotFound('客户不存在');
        }
        if (message === 'Lead already assigned') {
            return apiError('客户已被领取', 409);
        }

        return apiError(message, 500);
    }
}
