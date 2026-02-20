
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { apiError, apiPaginated } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';
import { withTiming } from '@/shared/middleware/api-timing';


const log = createLogger('mobile/tasks');
export const GET = withTiming(async (request: NextRequest) => {
    try {
        // 1. 认证
        const authResult = await authenticateMobile(request);
        if (!authResult.success) {
            return authResult.response;
        }
        const { session } = authResult;

        // 2. 权限检查 - 仅限工人访问任务列表? 
        // 实际上任务列表可能根据角色返回不同内容，这里先假设主要是工人
        // 或者通用查询。根据之前的逻辑是查 measureTasks 和 installTasks，这通常是工人的任务。
        const roleCheck = requireWorker(session);
        if (!roleCheck.allowed) {
            return roleCheck.response;
        }

        const workerId = session.userId;
        const tenantId = session.tenantId;

        // 3. 获取分页和过滤参数
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50);
        const status = searchParams.get('status'); // PENDING, IN_PROGRESS, COMPLETED
        const type = searchParams.get('type') || 'all'; // measure, install, all

        // 4. 构建过滤条件
        const measureConditions = [
            eq(measureTasks.assignedWorkerId, workerId),
            eq(measureTasks.tenantId, tenantId)
        ];
        const installConditions = [
            eq(installTasks.installerId, workerId),
            eq(installTasks.tenantId, tenantId)
        ];

        // 状态映射：将移动端通用状态映射到具体的业务状态
        if (status === 'PENDING') {
            measureConditions.push(inArray(measureTasks.status, ['PENDING', 'DISPATCHING', 'PENDING_VISIT']));
            installConditions.push(inArray(installTasks.status, ['PENDING_DISPATCH', 'DISPATCHING', 'PENDING_ACCEPT', 'PENDING_VISIT']));
        } else if (status === 'IN_PROGRESS') {
            measureConditions.push(inArray(measureTasks.status, ['PENDING_CONFIRM']));
            installConditions.push(inArray(installTasks.status, ['IN_PROGRESS', 'PENDING_CONFIRM']));
        } else if (status === 'COMPLETED') {
            measureConditions.push(eq(measureTasks.status, 'COMPLETED'));
            installConditions.push(eq(installTasks.status, 'COMPLETED'));
        }

        // 5. 统计总数 (分别统计)
        let mTotal = 0;
        let iTotal = 0;

        const countPromises = [];
        if (type === 'all' || type === 'measure') {
            countPromises.push(
                db.select({ count: sql<number>`count(*)::int` })
                    .from(measureTasks)
                    .where(and(...measureConditions))
                    .then(res => mTotal = res[0]?.count ?? 0)
            );
        }
        if (type === 'all' || type === 'install') {
            countPromises.push(
                db.select({ count: sql<number>`count(*)::int` })
                    .from(installTasks)
                    .where(and(...installConditions))
                    .then(res => iTotal = res[0]?.count ?? 0)
            );
        }
        await Promise.all(countPromises);
        const total = mTotal + iTotal;

        // 6. 执行查询 (两表合并分页策略：由于涉及跨表排序，取前 page*pageSize 条合并后切片)
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
                        lead: { columns: { address: true } }
                    }
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
                        customer: { columns: { name: true, phone: true } }
                    }
                })
            );
        } else {
            fetchPromises.push(Promise.resolve([]));
        }

        const [mTasks, iTasks] = await Promise.all(fetchPromises) as [
            Array<{
                id: string;
                measureNo: string;
                status: string | null;
                scheduledAt: Date | null;
                customer: { name: string; phone: string | null } | null;
                lead?: { address: string | null } | null;
            }>,
            Array<{
                id: string;
                taskNo: string;
                status: string | null;
                scheduledDate: Date | null;
                customer: { name: string; phone: string | null } | null;
                address: string | null;
            }>
        ];

        // 7. 合并、归一化并切片
        const combined = [
            ...mTasks.map(t => ({
                id: t.id,
                type: 'measure',
                docNo: t.measureNo,
                status: t.status,
                customer: t.customer,
                scheduledAt: t.scheduledAt,
                address: t.lead?.address || ''
            })),
            ...iTasks.map(t => ({
                id: t.id,
                type: 'install',
                docNo: t.taskNo,
                status: t.status,
                customer: t.customer,
                scheduledAt: t.scheduledDate,
                address: t.address || ''
            }))
        ].sort((a, b) => {
            const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
            const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
            return dateB - dateA; // 降序
        }).slice((page - 1) * pageSize, page * pageSize);

        return apiPaginated(combined, page, pageSize, total);

    } catch (error) {
        log.error('Mobile Task List Error', {}, error);
        return apiError('Internal Server Error', 500);
    }
});
