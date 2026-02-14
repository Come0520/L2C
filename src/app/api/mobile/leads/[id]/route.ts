
import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { leadSchema } from '@/features/leads/schemas';

/*
 * GET /api/mobile/leads/[id]
 * 获取线索详情
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const lead = await LeadService.getLead(id, session.tenantId);

        if (!lead) {
            return apiError('线索不存在或无权访问', 404);
        }

        return apiSuccess(lead);
    } catch (error) {
        console.error('获取线索详情失败:', error);
        return apiError('获取线索详情失败', 500);
    }
}

/*
 * PUT /api/mobile/leads/[id]
 * 更新线索信息
 */
export async function PUT(
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

        // 验证部分更新数据
        const parseResult = leadSchema.partial().safeParse(json);
        if (!parseResult.success) {
            return apiError(parseResult.error.issues[0].message, 400);
        }
        const data = parseResult.data;

        const updatedLead = await LeadService.updateLead(id, {
            ...data,
            estimatedAmount: data.estimatedAmount ? String(data.estimatedAmount) : undefined,
            notes: data.remark ?? undefined, // benchmark: remark -> notes
        }, session.tenantId);

        return apiSuccess(updatedLead);

    } catch (error) {
        console.error('更新线索失败:', error);
        return apiError('更新线索失败', 500);
    }
}
