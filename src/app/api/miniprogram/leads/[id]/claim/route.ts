/**
 * 线索认领 API
 *
 * POST /api/miniprogram/leads/[id]/claim
 *
 * @description 从线索池（公海池）认领线索，将当前销售设为负责人。
 * 复用 Web 端 claimFromPool 业务逻辑。
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
import { eq, and, isNull } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';
import { LeadService } from '@/services/lead.service';

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { id: leadId } = await params;

      // 查询线索（获取当前版本号用于乐观锁控制）
      const lead = await db.query.leads.findFirst({
        where: and(
          eq(leads.id, leadId),
          eq(leads.tenantId, user.tenantId),
          isNull(leads.assignedSalesId)
        ),
        columns: { id: true, version: true },
      });

      if (!lead) {
        return apiNotFound('线索不存在或已被认领');
      }

      // 认领：复用公用底层逻辑（底层会检验 version）
      await LeadService.claimFromPool(leadId, user.tenantId, user.id, lead.version);

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
      return apiServerError('认领线索失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
