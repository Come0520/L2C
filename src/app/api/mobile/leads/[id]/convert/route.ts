import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiForbidden,
} from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { z } from 'zod';
import { convertLeadSchema } from '@/features/leads/schemas';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/leads/[id]/convert');

/*
 * POST /api/mobile/leads/[id]/convert
 * 线索转客户
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await authenticateMobile(request);
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

  const salesCheck = requireSales(session);
  if (!salesCheck.allowed) return salesCheck.response;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return apiBadRequest('无效的线索ID');
    }
    const json = await request.json();

    // 验证线索归属 (仅允许转化自己负责的线索)
    const lead = await LeadService.getLead(id, session.tenantId);
    if (!lead) return apiNotFound('线索不存在');
    if (lead.assignedSalesId && lead.assignedSalesId !== session.userId) {
      return apiForbidden('无权转化他人的线索');
    }

    // 验证转化参数
    const payload = {
      leadId: id,
      customerId: json.customerId,
      force: json.force,
    };

    const parseResult = convertLeadSchema.safeParse(payload);
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.issues[0].message);
    }

    const { customerId } = parseResult.data;

    const newCustomerId = await LeadService.convertLead(
      id,
      customerId,
      session.tenantId,
      session.userId
    );

    return apiSuccess({ customerId: newCustomerId });
  } catch (error) {
    log.error('线索转客户失败', {}, error);
    return apiServerError('线索转客户失败');
  }
}
