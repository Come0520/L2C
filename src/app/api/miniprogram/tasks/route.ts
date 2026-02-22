/**
 * 小程序任务列表 API
 *
 * GET /api/miniprogram/tasks
 * 返回当前用户（师傅）的任务列表
 *
 * Query Params:
 * - type: 'measure' | 'install' | 'all' (默认 'all')
 * - status: 任务状态过滤
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks, customers } from '@/shared/api/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { getMiniprogramUser } from '../auth-utils';



export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const statusFilter = searchParams.get('status');

    const result: {
      measureTasks: Record<string, unknown>[];
      installTasks: Record<string, unknown>[];
    } = {
      measureTasks: [],
      installTasks: [],
    };

    // 获取测量任务（分配给当前用户的）
    if (type === 'all' || type === 'measure') {
      const measureQuery = db
        .select({
          id: measureTasks.id,
          measureNo: measureTasks.measureNo,
          status: measureTasks.status,
          scheduledAt: measureTasks.scheduledAt,
          type: measureTasks.type,
          laborFee: measureTasks.laborFee,
          remark: measureTasks.remark,
          createdAt: measureTasks.createdAt,
          // 关联客户信息
          customerName: customers.name,
          customerPhone: customers.phone,
        })
        .from(measureTasks)
        .leftJoin(customers, eq(measureTasks.customerId, customers.id))
        .where(
          and(
            eq(measureTasks.tenantId, user.tenantId),
            eq(measureTasks.assignedWorkerId, user.id),
            statusFilter
              ? eq(measureTasks.status, statusFilter as 'PENDING' | 'PENDING_VISIT' | 'PENDING_CONFIRM')
              : or(
                eq(measureTasks.status, 'PENDING'),
                eq(measureTasks.status, 'PENDING_VISIT'),
                eq(measureTasks.status, 'PENDING_CONFIRM')
              )
          )
        )
        .orderBy(desc(measureTasks.scheduledAt));

      result.measureTasks = await measureQuery;
    }

    // 获取安装任务（分配给当前用户的）
    if (type === 'all' || type === 'install') {
      const installQuery = db
        .select({
          id: installTasks.id,
          taskNo: installTasks.taskNo,
          status: installTasks.status,
          category: installTasks.category,
          scheduledDate: installTasks.scheduledDate,
          scheduledTimeSlot: installTasks.scheduledTimeSlot,
          remark: installTasks.remark,
          notes: installTasks.notes,
          createdAt: installTasks.createdAt,
          // 客户信息（直接存储在任务表中）
          customerName: installTasks.customerName,
          customerPhone: installTasks.customerPhone,
          address: installTasks.address,
        })
        .from(installTasks)
        .where(
          and(
            eq(installTasks.tenantId, user.tenantId),
            eq(installTasks.installerId, user.id),
            statusFilter
              ? eq(installTasks.status, statusFilter as 'PENDING_DISPATCH' | 'PENDING_VISIT' | 'PENDING_CONFIRM')
              : or(
                eq(installTasks.status, 'PENDING_DISPATCH'),
                eq(installTasks.status, 'PENDING_VISIT'),
                eq(installTasks.status, 'PENDING_CONFIRM')
              )
          )
        )
        .orderBy(desc(installTasks.scheduledDate));

      result.installTasks = await installQuery;
    }

    const response = apiSuccess(result);
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (error) {
    logger.error('获取任务列表失败:', error);
    return apiError('获取任务列表失败', 500);
  }
}
