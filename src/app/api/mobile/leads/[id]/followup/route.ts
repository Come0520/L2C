
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiError, apiSuccess, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';

interface FollowupParams {
    params: Promise<{ id: string }>;
}

interface FollowupBody {
    type: 'PHONE' | 'VISIT' | 'WECHAT' | 'OTHER';
    content: string;
    nextFollowUpAt?: string;
    status?: string;
    attachments?: string[];
}

type DbActivityType = 'PHONE_CALL' | 'WECHAT_CHAT' | 'STORE_VISIT' | 'HOME_VISIT' | 'QUOTE_SENT' | 'SYSTEM';

function mapFollowupType(mobileType: FollowupBody['type']): DbActivityType {
    const mapping: Record<FollowupBody['type'], DbActivityType> = {
        'PHONE': 'PHONE_CALL',
        'WECHAT': 'WECHAT_CHAT',
        'VISIT': 'HOME_VISIT',
        'OTHER': 'SYSTEM',
    };
    return mapping[mobileType] || 'SYSTEM';
}

export async function POST(request: NextRequest, { params }: FollowupParams) {
    const authResult = await authenticateMobile(request);
    if (!authResult.success) return authResult.response;
    const { session } = authResult;

    const salesCheck = requireSales(session);
    if (!salesCheck.allowed) return salesCheck.response;

    const { id: leadId } = await params;

    let body: FollowupBody;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { type, content, nextFollowUpAt, status } = body;

    if (!type || !content) {
        return apiError('缺少必要参数: type, content', 400);
    }

    try {
        // 验证客户归属 (LeadService 只检查租户，这里额外检查归属)
        const lead = await db.query.leads.findFirst({
            where: and(
                eq(leads.id, leadId),
                eq(leads.tenantId, session.tenantId),
                eq(leads.assignedSalesId, session.userId) // 仅限负责的销售
            ),
            columns: { id: true }
        });

        if (!lead) {
            return apiNotFound('客户不存在或不属于您');
        }

        // 调用 Service 添加跟进
        await LeadService.addActivity(leadId, {
            type: mapFollowupType(type),
            content,
            nextFollowupAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
        }, session.tenantId, session.userId);

        // 如果有状态更新，且状态不同，调用更新接口
        // 注意：LeadService.addActivity 会自动更新状态为 FOLLOWING_UP (如果之前是 PENDING_FOLLOWUP)
        // 这里主要处理其他显式状态变更
        if (status) {
            await LeadService.updateLead(leadId, {
                status: status as any
            }, session.tenantId);
        }

        return apiSuccess({ success: true });

    } catch (error) {
        console.error('添加跟进记录失败:', error);
        return apiError('添加跟进记录失败', 500);
    }
}
