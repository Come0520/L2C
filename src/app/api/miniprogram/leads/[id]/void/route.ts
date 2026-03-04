/**
 * 作废线索 API
 *
 * POST /api/miniprogram/leads/[id]/void
 *
 * @description 将线索标记为 INVALID（已作废），需附带作废原因。
 * 与 Web 端 voidLead action 保持一致的业务逻辑。
 */
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiBadRequest,
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

      const { id } = await params;
      const body = await request.json();
      const reason = body.reason?.trim();

      if (!reason) {
        return apiBadRequest('请填写作废原因');
      }

      // 查找线索（租户隔离）
      const existing = await db.query.leads.findFirst({
        where: and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)),
        columns: { id: true, status: true },
      });

      if (!existing) {
        return apiNotFound('线索不存在');
      }

      if (existing.status === 'INVALID') {
        return apiBadRequest('该线索已作废');
      }

      // 更新状态为 INVALID
      await db
        .update(leads)
        .set({
          status: 'INVALID',
          notes: reason,
          updatedAt: new Date(),
        })
        .where(and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)));

      // 审计日志
      await AuditService.log(db, {
        tableName: 'leads',
        recordId: id,
        action: 'VOID',
        userId: user.id,
        tenantId: user.tenantId,
        details: { source: 'miniprogram', reason },
      });

      logger.info('[Leads] 小程序作废线索成功', { leadId: id, reason, userId: user.id });
      return apiSuccess({ success: true });
    } catch (error) {
      logger.error('[Leads] 作废线索失败', { route: 'leads/[id]/void', error });
      return apiServerError('作废线索失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
