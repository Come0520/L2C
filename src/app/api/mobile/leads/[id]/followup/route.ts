
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiError, apiSuccess, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { LeadService } from '@/services/lead.service';
import { z } from 'zod';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/leads/[id]/followup');

interface FollowupParams {
    params: Promise<{ id: string }>;
}

/** 移动端跟进类型到数据库活动类型的映射 */
type MobileFollowupType = 'PHONE' | 'VISIT' | 'WECHAT' | 'OTHER';
type DbActivityType = 'PHONE_CALL' | 'WECHAT_CHAT' | 'STORE_VISIT' | 'HOME_VISIT' | 'QUOTE_SENT' | 'SYSTEM';

/** 移动端跟进请求体 Zod Schema */
const mobileFollowupBodySchema = z.object({
    type: z.enum(['PHONE', 'VISIT', 'WECHAT', 'OTHER'], {
        message: '无效的跟进类型，允许值: PHONE, VISIT, WECHAT, OTHER',
    }),
    content: z.string().min(1, '跟进内容不能为空'),
    nextFollowUpAt: z.string().datetime({ offset: true }).optional().nullable(),
    status: z.enum(['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP']).optional(),
    attachments: z.array(z.string()).optional(),
});

function mapFollowupType(mobileType: MobileFollowupType): DbActivityType {
    const mapping: Record<MobileFollowupType, DbActivityType> = {
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

    if (!z.string().uuid().safeParse(leadId).success) {
        return apiError('无效的线索ID', 400);
    }

    // 使用 Zod Schema 校验请求体
    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const parseResult = mobileFollowupBodySchema.safeParse(rawBody);
    if (!parseResult.success) {
        return apiError(parseResult.error.issues[0].message, 400);
    }

    const { type, content, nextFollowUpAt, status } = parseResult.data;

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
        const ALLOWED_STATUSES = ['PENDING_ASSIGNMENT', 'PENDING_FOLLOWUP', 'FOLLOWING_UP'] as const;

        if (status) {
            if (!ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
                return apiError('无效的状态值', 400);
            }
            await LeadService.updateLead(leadId, {
                status: status as typeof ALLOWED_STATUSES[number]
            }, session.tenantId, session.userId);
        }

        return apiSuccess({ success: true });

    } catch (error) {
        log.error('添加跟进记录失败', {}, error);
        return apiError('添加跟进记录失败', 500);
    }
}
