
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

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

        // Fetch Measure Tasks
        const mTasks = await db.query.measureTasks.findMany({
            where: eq(measureTasks.assignedWorkerId, workerId),
            orderBy: [desc(measureTasks.scheduledAt)],
            with: {
                customer: { columns: { name: true, phone: true } },
                lead: { columns: { address: true } }
            }
        });

        // Fetch Install Tasks
        const iTasks = await db.query.installTasks.findMany({
            where: eq(installTasks.installerId, workerId),
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

        return NextResponse.json({
            success: true,
            data: combined
        });

    } catch (error) {
        console.error('Mobile Task List Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
