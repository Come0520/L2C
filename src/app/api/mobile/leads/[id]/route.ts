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
import { leadSchema } from '@/features/leads/schemas';
import { z } from 'zod';
import { createLogger } from '@/shared/lib/logger';
import { maskPhone } from '@/shared/lib/utils';

const log = createLogger('mobile/leads/[id]');

// maskPhone 已从 @/shared/lib/utils 导入，消除重复定义

/*
 * GET /api/mobile/leads/[id]
 * 获取线索详情
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // 1. 认证
  const authResult = await authenticateMobile(request);
  if (!authResult.success) {
    return authResult.response;
  }
  const { session } = authResult;

  // 2. 权限
  const roleCheck = requireSales(session);
  if (!roleCheck.allowed) {
    return roleCheck.response;
  }

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return apiBadRequest('无效的线索ID');
    }

    const lead = await LeadService.getLead(id, session.tenantId);

    if (!lead) {
      return apiNotFound('线索不存在或无权访问');
    }

    return apiSuccess({
      ...lead,
      customerPhone: maskPhone(lead.customerPhone || ''),
      customer: lead.customer
        ? {
            ...lead.customer,
            phone: maskPhone(lead.customer?.phone || ''),
          }
        : null,
    });
  } catch (error) {
    log.error('获取线索详情失败', {}, error);
    return apiServerError('获取线索详情失败');
  }
}

/*
 * PUT /api/mobile/leads/[id]
 * 更新线索信息
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // 验证部分更新数据
    const parseResult = leadSchema.partial().safeParse(json);
    if (!parseResult.success) {
      return apiBadRequest(parseResult.error.issues[0].message);
    }
    const data = parseResult.data;

    // 验证线索归属（仅允许修改自己负责的线索）
    const lead = await LeadService.getLead(id, session.tenantId);
    if (!lead) return apiNotFound('线索不存在');
    if (lead.assignedSalesId && lead.assignedSalesId !== session.userId) {
      return apiForbidden('无权修改他人的线索');
    }

    const updatedLead = await LeadService.updateLead(
      id,
      {
        ...data,
        estimatedAmount: data.estimatedAmount ? String(data.estimatedAmount) : undefined,
        notes: data.remark ?? undefined, // benchmark: remark -> notes
      },
      session.tenantId,
      session.userId
    );

    return apiSuccess(updatedLead);
  } catch (error) {
    log.error('更新线索失败', {}, error);
    return apiServerError('更新线索失败');
  }
}
