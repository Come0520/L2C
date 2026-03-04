/**
 * 工程师排期日程 API
 *
 * GET /api/miniprogram/engineer/schedule
 * 查询该工程师的所有已经排期、处理中的量尺/安装任务。
 *
 * Query Params:
 *  - startDate: string (YYYY-MM-DD)
 *  - endDate: string (YYYY-MM-DD)
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiServerError, apiUnauthorized } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../auth-utils';

export const GET = withMiniprogramAuth(async (request: NextRequest, user) => {
  try {
    if (!user || (!user.tenantId && user.role !== 'SUPER_ADMIN')) {
      return apiUnauthorized('未授权');
    }

    // 获取时间区间
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate'); // ex: 2026-03-01
    const endDate = searchParams.get('endDate'); // ex: 2026-03-31

    // 1. 查询属于该工程师的量尺任务
    const measures = await db.query.measureTasks.findMany({
      where: and(
        eq(measureTasks.tenantId, user.tenantId as string),
        eq(measureTasks.assignedWorkerId, user.id)
      ),
      orderBy: [desc(measureTasks.scheduledAt)],
    });

    // 2. 查询属于该工程师的安装任务
    const installs = await db.query.installTasks.findMany({
      where: and(
        eq(installTasks.tenantId, user.tenantId as string),
        eq(installTasks.installerId, user.id)
      ),
      orderBy: [desc(installTasks.scheduledDate)],
    });

    // 拼装前台日历组件需要的数据结构
    const tasks = [];

    for (const m of measures) {
      if (!m.scheduledAt) continue;
      // 简单截取成 YYYY-MM-DD 的 key
      const dateStr =
        typeof m.scheduledAt === 'string' ? m.scheduledAt : (m.scheduledAt as Date).toISOString();
      const dateKey = dateStr.split('T')[0];

      // 时间区间过滤
      if (startDate && dateKey < startDate) continue;
      if (endDate && dateKey > endDate) continue;

      tasks.push({
        id: m.id,
        date: dateKey,
        title: `量尺 - ${m.measureNo}`,
        time:
          m.scheduledAt instanceof Date
            ? m.scheduledAt.toISOString().split('T')[1]?.substring(0, 5) || '全天'
            : String(m.scheduledAt).split('T')[1]?.substring(0, 5) || '全天',
        address: '客户地址(接口可带出)',
        customerName: '待关联客户',
        status: m.status,
        type: 'MEASURE',
      });
    }

    for (const i of installs) {
      if (!i.scheduledDate) continue;
      const dateStr =
        typeof i.scheduledDate === 'string'
          ? i.scheduledDate
          : (i.scheduledDate as Date).toISOString();
      const dateKey = dateStr.split('T')[0];

      // 时间区间过滤
      if (startDate && dateKey < startDate) continue;
      if (endDate && dateKey > endDate) continue;

      tasks.push({
        id: i.id,
        date: dateKey,
        title: `安装 - ${i.taskNo}`,
        time: i.scheduledTimeSlot || '全天',
        address: i.address || '地址未填写',
        customerName: i.customerName || '联系人',
        status: i.status,
        type: 'INSTALL',
      });
    }

    return apiSuccess({
      tasks,
    });
  } catch (error) {
    logger.error('[Schedule] 获取工程师排期异常', { route: 'engineer/schedule', error });
    return apiServerError('获取日程失败');
  }
});
