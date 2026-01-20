/**
 * 销售端 - 领取客户 API
 * POST /api/mobile/leads/:id/claim
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';

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

    try {
        // 3. 查找公海客户
        const lead = await db.query.leads.findFirst({
            where: and(
                eq(leads.id, leadId),
                eq(leads.tenantId, session.tenantId),
                isNull(leads.assignedSalesId)  // 必须是公海客户
            ),
            columns: {
                id: true,
                customerName: true,
                status: true,
            }
        });

        if (!lead) {
            return apiNotFound('客户不存在或已被领取');
        }

        // 4. 领取客户
        const now = new Date();
        await db.update(leads)
            .set({
                assignedSalesId: session.userId,
                assignedAt: now,
                status: lead.status === 'PENDING_ASSIGNMENT' ? 'PENDING_FOLLOWUP' : lead.status,
                updatedAt: now,
            })
            .where(eq(leads.id, leadId));

        console.log(`[客户领取] 销售 ${session.userId} 领取客户 ${leadId}`);

        return apiSuccess(
            {
                leadId,
                customerName: lead.customerName,
                assignedTo: session.userId,
                assignedAt: now.toISOString(),
            },
            '客户领取成功'
        );

    } catch (error) {
        console.error('客户领取错误:', error);
        return apiError('领取客户失败', 500);
    }
}
