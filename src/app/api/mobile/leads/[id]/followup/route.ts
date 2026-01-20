/**
 * 销售端 - 添加跟进记录 API
 * POST /api/mobile/leads/:id/followup
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { leads, leadActivities } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';

interface FollowupParams {
    params: Promise<{ id: string }>;
}

/**
 * 跟进记录请求体
 * 移动端使用简化的跟进方式，需要映射到数据库枚举值
 */
interface FollowupBody {
    type: 'PHONE' | 'VISIT' | 'WECHAT' | 'OTHER';  // 跟进方式（移动端简化值）
    content: string;                                 // 跟进内容
    nextFollowUpAt?: string;                        // 下次跟进时间
    status?: string;                                 // 更新客户状态
    attachments?: string[];                         // 附件（语音/图片）
}

/**
 * 移动端跟进类型映射到数据库枚举值
 * Schema 定义的有效值：PHONE_CALL, WECHAT_CHAT, STORE_VISIT, HOME_VISIT, QUOTE_SENT, SYSTEM
 */
type DbActivityType = 'PHONE_CALL' | 'WECHAT_CHAT' | 'STORE_VISIT' | 'HOME_VISIT' | 'QUOTE_SENT' | 'SYSTEM';

function mapFollowupType(mobileType: FollowupBody['type']): DbActivityType {
    const mapping: Record<FollowupBody['type'], DbActivityType> = {
        'PHONE': 'PHONE_CALL',
        'WECHAT': 'WECHAT_CHAT',
        'VISIT': 'HOME_VISIT',
        'OTHER': 'SYSTEM',
    };
    return mapping[mobileType];
}

export async function POST(request: NextRequest, { params }: FollowupParams) {
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

    // 3. 解析请求体
    let body: FollowupBody;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { type, content, nextFollowUpAt, status, attachments } = body;

    // 4. 参数校验
    if (!type || !content) {
        return apiError('缺少必要参数: type, content', 400);
    }

    try {
        // 5. 验证客户归属
        const lead = await db.query.leads.findFirst({
            where: and(
                eq(leads.id, leadId),
                eq(leads.tenantId, session.tenantId),
                eq(leads.assignedSalesId, session.userId)
            ),
            columns: {
                id: true,
                customerName: true,
            }
        });

        if (!lead) {
            return apiNotFound('客户不存在或不属于您');
        }

        const now = new Date();

        // 6. 创建跟进记录
        const [followUp] = await db.insert(leadActivities).values({
            tenantId: session.tenantId,
            leadId,
            activityType: mapFollowupType(type),
            content,
            createdBy: session.userId,
            createdAt: now,
        }).returning({ id: leadActivities.id });

        // 7. 更新客户信息
        const updateData: Record<string, unknown> = {
            lastActivityAt: now,
            nextFollowupAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
            updatedAt: now,
        };

        if (status) {
            updateData.status = status;
        }

        await db.update(leads)
            .set(updateData)
            .where(eq(leads.id, leadId));

        console.log(`[跟进记录] 客户 ${leadId}, 方式: ${type}`);

        return apiSuccess(
            {
                followUpId: followUp.id,
                leadId,
                type,
                createdAt: now.toISOString(),
            },
            '跟进记录添加成功'
        );

    } catch (error) {
        console.error('添加跟进记录错误:', error);
        return apiError('添加跟进记录失败', 500);
    }
}
