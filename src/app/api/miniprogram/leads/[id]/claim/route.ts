/**
 * 线索认领 API
 *
 * POST /api/miniprogram/leads/[id]/claim
 *
 * @description 从线索池（公海池）认领线索，将当前销售设为负责人。
 * 复用 Web 端 claimFromPool 业务逻辑。
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getMiniprogramUser } from '../../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { id: leadId } = await params;

    // 查询线索（必须属于同租户且未分配）
    const lead = await db.query.leads.findFirst({
      where: and(
        eq(leads.id, leadId),
        eq(leads.tenantId, user.tenantId),
        isNull(leads.assignedSalesId)
      ),
      columns: { id: true, status: true },
    });

    if (!lead) {
      return apiError('线索不存在或已被认领', 404);
    }

    // 认领：设置当前销售为负责人，状态改为待跟进
    await db
      .update(leads)
      .set({
        assignedSalesId: user.id,
        status: 'PENDING_FOLLOWUP',
        updatedAt: new Date(),
      })
      // 同时加 tenantId 过滤，防止 TOCTOU 跨租户修改窗口
      .where(and(eq(leads.id, leadId), eq(leads.tenantId, user.tenantId)));

    // 审计日志
    await AuditService.log(db, {
      tableName: 'leads',
      recordId: leadId,
      action: 'UPDATE',
      userId: user.id,
      tenantId: user.tenantId,
      details: { action: 'CLAIM_FROM_POOL', source: 'miniprogram' },
    });

    logger.info('[Leads] 小程序认领线索成功', {
      route: 'leads/[id]/claim',
      leadId,
      userId: user.id,
    });

    return apiSuccess({ message: '认领成功' });
  } catch (error) {
    logger.error('[Leads] 认领线索失败', { route: 'leads/[id]/claim', error });
    return apiError('认领线索失败', 500);
  }
}
