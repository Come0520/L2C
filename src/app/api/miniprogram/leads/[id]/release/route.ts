/**
 * 线索释放 API
 *
 * POST /api/miniprogram/leads/[id]/release
 *
 * @description 将线索释放回公海池，取消当前销售的分配。
 * 复用 Web 端 releaseToPool 业务逻辑。
 */
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { leads } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { id: leadId } = await params;

      // 查询线索（必须属于同租户且当前销售是负责人）
      const lead = await db.query.leads.findFirst({
        where: and(
          eq(leads.id, leadId),
          eq(leads.tenantId, user.tenantId),
          eq(leads.assignedSalesId, user.id)
        ),
        columns: { id: true, status: true },
      });

      if (!lead) {
        return apiNotFound('线索不存在或无权释放');
      }

      // 释放：清除负责人，状态改为待分配
      await db
        .update(leads)
        .set({
          assignedSalesId: null,
          status: 'PENDING_ASSIGNMENT',
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
        details: { action: 'RELEASE_TO_POOL', source: 'miniprogram' },
      });

      logger.info('[Leads] 小程序释放线索成功', {
        route: 'leads/[id]/release',
        leadId,
        userId: user.id,
      });

      return apiSuccess({ message: '已释放到线索池' });
    } catch (error) {
      logger.error('[Leads] 释放线索失败', { route: 'leads/[id]/release', error });
      return apiServerError('释放线索失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
