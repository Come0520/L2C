
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { voidLeadSchema } from '@/features/leads/schemas';

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
        const json = await request.json();

        // 验证作废参数 { reason: string }
        // voidLeadSchema: { id: string, reason: string }
        // Ignore id from body
        const reason = json.reason;

        if (!reason || typeof reason !== 'string') {
            return apiError('缺少作废原因', 400);
        }

        await LeadService.voidLead(id, reason, session.tenantId, session.userId);

        return apiSuccess({ success: true });

    } catch (error) {
        console.error('作废线索失败:', error);
        return apiError('作废线索失败', 500);
    }
}
