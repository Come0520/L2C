/**
 * 线索跟进记录 API
 *
 * GET  /api/miniprogram/leads/[id]/followup — 获取跟进时间线
 * POST /api/miniprogram/leads/[id]/followup — 添加跟进记录
 *
 * @description 复用 Web 端 leadActivities 表和 addLeadFollowupSchema。
 * 跟进类型与 Web 端 followUpTypeEnum 完全一致。
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { leads, leadActivities } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getMiniprogramUser } from '../../../auth-utils';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

/** 跟进记录输入验证 — 与 Web 端 addLeadFollowupSchema 对齐 */
const followupSchema = z.object({
  type: z
    .enum([
      'PHONE_CALL',
      'WECHAT_CHAT',
      'STORE_VISIT',
      'HOME_VISIT',
      'QUOTE_SENT',
      'SYSTEM',
      'OTHER',
    ])
    .default('PHONE_CALL'),
  content: z.string().min(1, '跟进内容不能为空'),
  nextFollowupAt: z.string().optional(),
  purchaseIntention: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

/** GET — 获取线索跟进时间线 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { id: leadId } = await params;

    // 开发环境 mock 已移除

    // 验证线索归属
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, leadId), eq(leads.tenantId, user.tenantId)),
      columns: { id: true },
    });
    if (!lead) {
      return apiError('线索不存在', 404);
    }

    // 查询跟进记录（按时间倒序）
    const activities = await db.query.leadActivities.findMany({
      where: eq(leadActivities.leadId, leadId),
      with: {
        creator: { columns: { name: true } },
      },
      orderBy: [desc(leadActivities.createdAt)],
    });

    return apiSuccess(activities);
  } catch (error) {
    logger.error('[Leads] 获取跟进记录失败', { route: 'leads/[id]/followup', error });
    return apiError('获取跟进记录失败', 500);
  }
}

/** POST — 添加跟进记录 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { id: leadId } = await params;
    const body = await request.json();

    // 验证输入
    const parsed = followupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    // 验证线索归属
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, leadId), eq(leads.tenantId, user.tenantId)),
      columns: { id: true, status: true },
    });
    if (!lead) {
      return apiError('线索不存在', 404);
    }

    const { type, content, purchaseIntention } = parsed.data;

    // 插入跟进记录
    const [activity] = await db
      .insert(leadActivities)
      .values({
        leadId,
        tenantId: user.tenantId,
        activityType: type as any,
        content,
        createdBy: user.id,
      })
      .returning();

    // 如果线索当前状态为待跟进，自动更新为跟进中
    if (lead.status === 'PENDING_FOLLOWUP') {
      await db
        .update(leads)
        .set({ status: 'FOLLOWING_UP', updatedAt: new Date() })
        // 同时加 tenantId 过滤，防止 TOCTOU 跨租户修改窗口
        .where(and(eq(leads.id, leadId), eq(leads.tenantId, user.tenantId)));
    }

    // 如果传入购买意向，更新线索意向级别
    if (purchaseIntention) {
      await db
        .update(leads)
        .set({ intentionLevel: purchaseIntention, updatedAt: new Date() })
        // 同时加 tenantId 过滤，防止 TOCTOU 跨租户修改窗口
        .where(and(eq(leads.id, leadId), eq(leads.tenantId, user.tenantId)));
    }

    // 审计日志
    await AuditService.log(db, {
      tableName: 'lead_activities',
      recordId: activity.id,
      action: 'CREATE',
      userId: user.id,
      tenantId: user.tenantId,
      details: { leadId, type, source: 'miniprogram' },
    });

    logger.info('[Leads] 小程序添加跟进成功', {
      route: 'leads/[id]/followup',
      activityId: activity.id,
      leadId,
      userId: user.id,
    });

    return apiSuccess(activity);
  } catch (error) {
    logger.error('[Leads] 添加跟进失败', { route: 'leads/[id]/followup', error });
    return apiError('添加跟进失败', 500);
  }
}
