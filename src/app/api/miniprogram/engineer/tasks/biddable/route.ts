/**
 * 工程师抢单池（待接单工单）API
 *
 * GET /api/miniprogram/engineer/tasks/biddable
 * 查询当前所属租户下、尚未指派任何工人（或正处于抢单状态）的量尺和安装任务。
 *
 * 业务场景：安装师傅通过小程序“抢单池”查看并接取新的量尺（MEASURE）或安装（INSTALL）任务。
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { apiSuccess, apiServerError, apiUnauthorized } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      // --- 1. 查询待指派的量尺任务 (MEASURE) ---
      // 状态为 PENDING 且 assignedWorkerId 为空的量尺任务
      const rawMeasures = await db.query.measureTasks.findMany({
        where: and(
          eq(measureTasks.tenantId, user.tenantId),
          eq(measureTasks.status, 'PENDING'),
          isNull(measureTasks.assignedWorkerId)
        ),
        orderBy: [desc(measureTasks.createdAt)],
        columns: {
          id: true,
          measureNo: true,
          status: true,
          scheduledAt: true,
          checkInLocation: true,
          laborFee: true,
          createdAt: true,
        },
      });

      const formatMeasures = rawMeasures.map((task) => ({
        id: task.id,
        taskNo: task.measureNo,
        type: 'MEASURE',
        typeLabel: '上门测量',
        // 这里可以基于 checkInLocation 计算距离或解析省市区，目前先假定通过关联得出或者需要地址字段
        address: '地址解析待完善',
        customerName: '待联系',
        distance: '未知', // 可配合地图服务
        systemPrice: task.laborFee ? Number(task.laborFee) : 0,
        scheduledDate: task.scheduledAt,
        status: task.status,
        createdAt: task.createdAt,
      }));

      // --- 2. 查询待指派的安装任务 (INSTALL) ---
      // 状态为 PENDING_DISPATCH 且 installerId 为空的安装任务
      const rawInstalls = await db.query.installTasks.findMany({
        where: and(
          eq(installTasks.tenantId, user.tenantId),
          eq(installTasks.status, 'PENDING_DISPATCH'),
          isNull(installTasks.installerId)
        ),
        orderBy: [desc(installTasks.createdAt)],
        columns: {
          id: true,
          taskNo: true,
          status: true,
          category: true,
          scheduledDate: true,
          scheduledTimeSlot: true,
          address: true,
          customerName: true,
          laborFee: true,
          createdAt: true,
        },
      });

      const formatInstalls = rawInstalls.map((task) => ({
        id: task.id,
        taskNo: task.taskNo,
        type: 'INSTALL',
        typeLabel: task.category === 'CURTAIN' ? '窗帘安装' : '品类安装',
        address: task.address || '地址未提供',
        customerName: task.customerName || '待联系',
        distance: '未知',
        systemPrice: task.laborFee ? Number(task.laborFee) : 0,
        scheduledDate: task.scheduledDate,
        timeSlot: task.scheduledTimeSlot,
        status: task.status,
        createdAt: task.createdAt,
      }));

      // 聚合并按创建时间倒序返回前端
      const results = [...formatMeasures, ...formatInstalls].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return apiSuccess(results);
    } catch (error) {
      logger.error('[BiddableTasks] 获取待接单池列表失败', {
        route: 'engineer/tasks/biddable',
        error,
      });
      return apiServerError('获取待接单池失败');
    }
  },
  ['WORKER']
);
