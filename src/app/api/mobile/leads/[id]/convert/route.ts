
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { convertLeadSchema } from '@/features/leads/schemas';

/*
 * POST /api/mobile/leads/[id]/convert
 * 线索转客户
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

        // 验证转化参数 (部分验证，leadId 来自 URL)
        // convertLeadSchema: { leadId: string, customerId?: string }
        // Mobile payload: { customerId?: string }

        const customerId = json.customerId;

        const newCustomerId = await LeadService.convertLead(id, customerId, session.tenantId, session.userId);

        return apiSuccess({ customerId: newCustomerId });

    } catch (error) {
        console.error('线索转客户失败:', error);
        return apiError('线索转客户失败', 500);
    }
}
