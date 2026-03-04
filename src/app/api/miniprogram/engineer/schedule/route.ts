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
import { measureTasks, installTasks, customers } from '@/shared/api/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../../auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || (!user.tenantId && user.role !== 'SUPER_ADMIN')) {
      return apiError('未授权', 401);
    }

    // 获取时间区间
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate'); // ex: 2026-03-01
    const endDate = searchParams.get('endDate'); // ex: 2026-03-31

    // 默认查询最近一个月或从当天起的一个月
    // 此处简化，不带时间过滤时返回本月数据，由于是演示性质，暂时全查或按传入参数查

    // 1. 查询属于该工程师的量尺任务
    const measures = await db.query.measureTasks.findMany({
      where: and(
        eq(measureTasks.tenantId, user.tenantId as string),
        eq(measureTasks.assignedWorkerId, user.id)
        // 此处可追加状态过滤（如不能是 CANCELLED）
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
      const dateKey = m.scheduledAt.split('T')[0];

      // 时间区间过滤
      if (startDate && dateKey < startDate) continue;
      if (endDate && dateKey > endDate) continue;

      tasks.push({
        id: m.id,
        date: dateKey,
        title: `量尺 - ${m.measureNo}`,
        time: m.scheduledAt.split('T')[1]?.substring(0, 5) || '全天',
        address: '客户地址(接口可带出)',
        customerName: '待关联客户',
        status: m.status,
        type: 'MEASURE',
      });
    }

    for (const i of installs) {
      if (!i.scheduledDate) continue;
      const dateKey = i.scheduledDate; // 本身就是 YYYY-MM-DD 或 ISO Date string

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
    return apiError('获取日程失败', 500);
  }
}
