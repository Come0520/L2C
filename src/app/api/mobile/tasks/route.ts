
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';


const log = createLogger('mobile/tasks');
export async function GET(request: NextRequest) {
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

        // Fetch Measure Tasks (With Tenant Isolation)
        const mTasks = await db.query.measureTasks.findMany({
            where: and(
                eq(measureTasks.assignedWorkerId, workerId),
                eq(measureTasks.tenantId, session.tenantId)
            ),
            orderBy: [desc(measureTasks.scheduledAt)],
            with: {
                customer: { columns: { name: true, phone: true } },
                lead: { columns: { address: true } }
            }
        });

        // Fetch Install Tasks (With Tenant Isolation)
        const iTasks = await db.query.installTasks.findMany({
            where: and(
                eq(installTasks.installerId, workerId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            orderBy: [desc(installTasks.scheduledDate)],
            with: {
                customer: { columns: { name: true, phone: true } }
            }
        });

        // Normalize and Combine
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
            return dateB - dateA; // Descending
        });

        return apiSuccess(combined);

    } catch (error) {
        log.error('Mobile Task List Error', {}, error);
        return apiError('Internal Server Error', 500);
    }
}
