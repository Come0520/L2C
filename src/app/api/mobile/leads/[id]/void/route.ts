
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { z } from 'zod';
import { voidLeadSchema } from '@/features/leads/schemas';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/leads/[id]/void');

/*
 * POST /api/mobile/leads/[id]/void
 * 作废线索
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;
    const { session } = authResult;

    const salesCheck = requireSales(session);
    if (!salesCheck.allowed) return salesCheck.response;

    try {
        const { id } = await params;

        if (!z.string().uuid().safeParse(id).success) {
            return apiError('无效的线索ID', 400);
        }

        const json = await request.json();

        // 验证线索归属
        const lead = await LeadService.getLead(id, session.tenantId);
        if (!lead) return apiError('线索不存在', 404);
        // 验证线索归属：仅允许归属销售作废自己的线索
        if (lead.assignedSalesId !== session.userId) {
            return apiError('无权作废他人的线索', 403);
        }

        // 验证作废参数 { reason: string }
        // voidLeadSchema: { id: string, reason: string }
        // Ignore id from body
        const parseResult = voidLeadSchema.safeParse({ id, reason: json.reason });
        if (!parseResult.success) {
            return apiError(parseResult.error.issues[0].message, 400);
        }
        const { reason } = parseResult.data;

        await LeadService.voidLead(id, reason, session.tenantId, session.userId);

        return apiSuccess({ success: true });

    } catch (error) {
        log.error('作废线索失败', {}, error);
        return apiError('作废线索失败', 500);
    }
}
