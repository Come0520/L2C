import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile/task-service');

export interface GetMobileTasksParams {
  workerId: string;
  tenantId: string;
  page: number;
  pageSize: number;
  status: string | null;
  type: string;
}

export const mobileTaskService = {
  /**
   * 分页获取移动端工匠分配的任务（安装与测量）
   */
  async getPaginatedTasks(params: GetMobileTasksParams) {
    const { workerId, tenantId, page, pageSize, status, type } = params;

    const measureConditions = [
      eq(measureTasks.assignedWorkerId, workerId),
      eq(measureTasks.tenantId, tenantId),
    ];
    const installConditions = [
      eq(installTasks.installerId, workerId),
      eq(installTasks.tenantId, tenantId),
    ];

    // 状态映射：将移动端通用状态映射到具体的业务状态
    if (status === 'PENDING') {
      measureConditions.push(
        inArray(measureTasks.status, ['PENDING', 'DISPATCHING', 'PENDING_VISIT'])
      );
      installConditions.push(
        inArray(installTasks.status, [
          'PENDING_DISPATCH',
          'DISPATCHING',
          'PENDING_ACCEPT',
          'PENDING_VISIT',
        ])
      );
    } else if (status === 'IN_PROGRESS') {
      measureConditions.push(inArray(measureTasks.status, ['PENDING_CONFIRM']));
      installConditions.push(inArray(installTasks.status, ['IN_PROGRESS', 'PENDING_CONFIRM']));
    } else if (status === 'COMPLETED') {
      measureConditions.push(eq(measureTasks.status, 'COMPLETED'));
      installConditions.push(eq(installTasks.status, 'COMPLETED'));
    }

    // 分别统计
    let mTotal = 0;
    let iTotal = 0;

    const countPromises = [];
    if (type === 'all' || type === 'measure') {
      countPromises.push(
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(measureTasks)
          .where(and(...measureConditions))
          .then((res) => (mTotal = res[0]?.count ?? 0))
      );
    }
    if (type === 'all' || type === 'install') {
      countPromises.push(
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(installTasks)
          .where(and(...installConditions))
          .then((res) => (iTotal = res[0]?.count ?? 0))
      );
    }
    await Promise.all(countPromises);
    const total = mTotal + iTotal;

    const limit = page * pageSize;
    const fetchPromises = [];

    if (type === 'all' || type === 'measure') {
      fetchPromises.push(
        db.query.measureTasks.findMany({
          where: and(...measureConditions),
          orderBy: [desc(measureTasks.scheduledAt)],
          limit,
          with: {
            customer: { columns: { name: true, phone: true } },
            lead: { columns: { address: true } },
          },
        })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    if (type === 'all' || type === 'install') {
      fetchPromises.push(
        db.query.installTasks.findMany({
          where: and(...installConditions),
          orderBy: [desc(installTasks.scheduledDate)],
          limit,
          with: {
            customer: { columns: { name: true, phone: true } },
          },
        })
      );
    } else {
      fetchPromises.push(Promise.resolve([]));
    }

    const [mTasks, iTasks] = (await Promise.all(fetchPromises)) as unknown as [
      Array<{
        id: string;
        measureNo: string;
        status: string;
        scheduledAt: string | Date | null;
        customer: { name: string; phone: string | null } | null;
        lead?: { address: string | null } | null;
      }>,
      Array<{
        id: string;
        taskNo: string;
        status: string;
        scheduledDate: string | Date | null;
        customer: { name: string; phone: string | null } | null;
        address: string | null;
      }>,
    ];

    const combined = [
      ...mTasks.map((t) => ({
        id: t.id,
        type: 'measure',
        docNo: t.measureNo,
        status: t.status,
        customer: t.customer,
        scheduledAt: t.scheduledAt,
        address: t.lead?.address || '',
      })),
      ...iTasks.map((t) => ({
        id: t.id,
        type: 'install',
        docNo: t.taskNo,
        status: t.status,
        customer: t.customer,
        scheduledAt: t.scheduledDate,
        address: t.address || '',
      })),
    ]
      .toSorted((a, b) => {
        const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return dateB - dateA; // 降序
      })
      .slice((page - 1) * pageSize, page * pageSize);

    return { total, combined };
  },
};
