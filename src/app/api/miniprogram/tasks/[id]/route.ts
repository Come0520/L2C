/**
 * 任务详情 API
 *
 * GET /api/miniprogram/tasks/[id]
 * 获取特定任务的详细信息
 *
 * POST /api/miniprogram/tasks/[id]
 * 更新任务状态或上传信息
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
import {
  measureTasks,
  installTasks,
  customers,
  measureSheets,
  laborRates,
  leads,
} from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type'); // 'measure' or 'install'

      if (!type) {
        return apiBadRequest('缺少任务类型参数');
      }

      let taskData = null;

      if (type === 'measure') {
        const rawTask = await db
          .select()
          .from(measureTasks)
          .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)))
          .limit(1);
        if (!rawTask.length) return apiNotFound('任务不存在');

        const t = rawTask[0];

        // 查询客户
        const customer = await db
          .select()
          .from(customers)
          .where(and(eq(customers.id, t.customerId), eq(customers.tenantId, user.tenantId)))
          .limit(1);

        // 查询量尺单
        const sheets = await db
          .select()
          .from(measureSheets)
          .where(and(eq(measureSheets.taskId, t.id), eq(measureSheets.tenantId, user.tenantId)));

        // 查询工费定价规则
        let laborFeeRule = null;
        if (t.assignedWorkerId) {
          const workerRates = await db
            .select()
            .from(laborRates)
            .where(
              and(
                eq(laborRates.tenantId, user.tenantId),
                eq(laborRates.entityType, 'WORKER'),
                eq(laborRates.entityId, t.assignedWorkerId),
                eq(
                  laborRates.category,
                  t.type === 'QUOTE_BASED' ? 'MEASURE_PRECISE' : 'MEASURE_LEAD'
                )
              )
            )
            .limit(1);

          if (workerRates.length > 0) {
            laborFeeRule = workerRates[0];
          } else {
            const tenantRates = await db
              .select()
              .from(laborRates)
              .where(
                and(
                  eq(laborRates.tenantId, user.tenantId),
                  eq(laborRates.entityType, 'TENANT'),
                  eq(laborRates.entityId, user.tenantId),
                  eq(
                    laborRates.category,
                    t.type === 'QUOTE_BASED' ? 'MEASURE_PRECISE' : 'MEASURE_LEAD'
                  )
                )
              )
              .limit(1);
            if (tenantRates.length > 0) {
              laborFeeRule = tenantRates[0];
            }
          }
        }

        // 如果是带方案测量，查询关联的报价单摘要
        let quoteSummary = null;
        if (t.type === 'QUOTE_BASED' && t.leadId) {
          const leadData = await db.query.leads.findFirst({
            where: and(eq(leads.id, t.leadId), eq(leads.tenantId, user.tenantId)),
            with: {
              quotes: {
                orderBy: (quotes, { desc }) => [desc(quotes.createdAt)],
                limit: 1,
                with: {
                  rooms: {
                    with: {
                      items: {
                        columns: {
                          id: true,
                          productName: true,
                          width: true,
                          height: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

          if (leadData?.quotes?.[0]) {
            const firstQuote = leadData.quotes[0];
            quoteSummary = {
              quoteNo: firstQuote.quoteNo,
              rooms: firstQuote.rooms.map((room) => ({
                roomName: room.name,
                items: room.items,
              })),
            };
          }
        }

        taskData = {
          ...t,
          customer: customer[0],
          sheets: sheets,
          laborFeeRule: laborFeeRule
            ? {
                unitType: laborFeeRule.unitType,
                unitPrice: laborFeeRule.unitPrice,
                baseFee: laborFeeRule.baseFee,
              }
            : null,
          quoteSummary,
        };
      } else if (type === 'install') {
        const rawTask = await db
          .select()
          .from(installTasks)
          .where(and(eq(installTasks.id, id), eq(installTasks.tenantId, user.tenantId)))
          .limit(1);
        if (!rawTask.length) return apiNotFound('任务不存在');

        taskData = {
          ...rawTask[0],
        };
      }

      return apiSuccess(taskData);
    } catch (error) {
      logger.error('Get Task Detail Error:', error);
      return apiServerError('获取详情失败');
    }
  }
);

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { type, action, data } = body;

      if (type === 'measure') {
        if (action === 'update_status') {
          await db
            .update(measureTasks)
            .set({ status: data.status, updatedAt: new Date() })
            .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)));
        }
      } else if (type === 'install') {
        if (action === 'update_status') {
          await db
            .update(installTasks)
            .set({ status: data.status, updatedAt: new Date() })
            .where(and(eq(installTasks.id, id), eq(installTasks.tenantId, user.tenantId)));
        }
      }

      return apiSuccess({ message: '更新成功' });
    } catch (error) {
      logger.error('Update Task Error:', error);
      return apiServerError('更新失败');
    }
  }
);
