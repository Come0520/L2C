/**
 * 线索转化为客户 API
 *
 * POST /api/miniprogram/leads/[id]/convert
 *
 * @description 将线索转化为正式客户。
 * 复用 Web 端 customers 表结构，确保数据一致性。
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
import { leads, customers } from '@/shared/api/schema';
import { eq, and, count } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { id } = await params;

      // 查找线索（租户隔离）
      const lead = await db.query.leads.findFirst({
        where: and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)),
      });

      if (!lead) {
        return apiNotFound('线索不存在');
      }

      if (lead.status === 'WON') {
        return apiBadRequest('该线索已转化');
      }

      if (lead.status === 'INVALID') {
        return apiBadRequest('已作废的线索不能转化');
      }

      // 检查是否已有同名/同手机的客户
      if (lead.customerPhone) {
        const existingCustomer = await db.query.customers.findFirst({
          where: and(
            eq(customers.tenantId, user.tenantId),
            eq(customers.phone, lead.customerPhone)
          ),
          columns: { id: true, name: true },
        });

        if (existingCustomer) {
          // 已存在客户，直接关联
          await db
            .update(leads)
            .set({
              status: 'WON',
              customerId: existingCustomer.id,
              updatedAt: new Date(),
            })
            .where(and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)));

          return apiSuccess({
            customerId: existingCustomer.id,
            message: `已关联到现有客户：${existingCustomer.name}`,
          });
        }
      }

      // 生成客户编号
      const now = new Date();
      const datePrefix = `C${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const todayCount = await db
        .select({ count: count() })
        .from(customers)
        .where(and(eq(customers.tenantId, user.tenantId)));
      const customerNo = `${datePrefix}${String((todayCount[0]?.count || 0) + 1).padStart(4, '0')}`;

      // 创建新客户
      const [newCustomer] = await db
        .insert(customers)
        .values({
          tenantId: user.tenantId,
          customerNo,
          name: lead.customerName,
          phone: lead.customerPhone,
          wechat: lead.customerWechat || null,
          notes: [lead.address, lead.community, lead.houseType].filter(Boolean).join(' ') || null,
          assignedSalesId: lead.assignedSalesId || user.id,
          pipelineStatus: 'PENDING_QUOTE',
          createdBy: user.id,
        })
        .returning();

      // 更新线索状态为 WON，关联客户 ID
      await db
        .update(leads)
        .set({
          status: 'WON',
          customerId: newCustomer.id,
          updatedAt: new Date(),
        })
        .where(and(eq(leads.id, id), eq(leads.tenantId, user.tenantId)));

      // 审计日志
      await AuditService.log(db, {
        tableName: 'leads',
        recordId: id,
        action: 'CONVERT',
        userId: user.id,
        tenantId: user.tenantId,
        details: { source: 'miniprogram', customerId: newCustomer.id },
      });

      logger.info('[Leads] 小程序线索转化客户成功', {
        leadId: id,
        customerId: newCustomer.id,
        userId: user.id,
      });
      return apiSuccess({ customerId: newCustomer.id, message: '转化成功' });
    } catch (error) {
      logger.error('[Leads] 线索转化失败', { route: 'leads/[id]/convert', error });
      return apiServerError('线索转化失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
