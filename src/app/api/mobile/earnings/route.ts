/**
 * 工人端 - 收入统计 API
 * GET /api/mobile/earnings
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, measureTasks } from '@/shared/api/schema';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';


const log = createLogger('mobile/earnings');
export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireWorker(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    const workerId = session.userId;

    // 3. 计算时间范围
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    try {
        // 4. 查询安装任务工费统计
        const installStats = await db
            .select({
                totalFee: sql<string>`COALESCE(SUM(CAST(${installTasks.actualLaborFee} AS DECIMAL)), 0)`,
                completedCount: sql<number>`COUNT(*)`,
            })
            .from(installTasks)
            .where(and(
                eq(installTasks.tenantId, session.tenantId),
                eq(installTasks.installerId, workerId),
                eq(installTasks.status, 'COMPLETED'),
            ));

        // 5. 本月统计
        const monthlyStats = await db
            .select({
                monthlyFee: sql<string>`COALESCE(SUM(CAST(${installTasks.actualLaborFee} AS DECIMAL)), 0)`,
                monthlyCount: sql<number>`COUNT(*)`,
            })
            .from(installTasks)
            .where(and(
                eq(installTasks.tenantId, session.tenantId),
                eq(installTasks.installerId, workerId),
                eq(installTasks.status, 'COMPLETED'),
                gte(installTasks.completedAt, monthStart),
                lte(installTasks.completedAt, monthEnd),
            ));

        // 6. 待结算统计（假设已完成但未结算的）
        const pendingStats = await db
            .select({
                pendingFee: sql<string>`COALESCE(SUM(CAST(${installTasks.actualLaborFee} AS DECIMAL)), 0)`,
                pendingCount: sql<number>`COUNT(*)`,
            })
            .from(installTasks)
            .where(and(
                eq(installTasks.tenantId, session.tenantId),
                eq(installTasks.installerId, workerId),
                eq(installTasks.status, 'COMPLETED'),
                // 假设 7 天内完成的为待结算
                gte(installTasks.completedAt, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
            ));

        // 7. 测量任务统计（如有工费）
        const measureStats = await db
            .select({
                measureCount: sql<number>`COUNT(*)`,
            })
            .from(measureTasks)
            .where(and(
                eq(measureTasks.tenantId, session.tenantId),
                eq(measureTasks.assignedWorkerId, workerId),
                eq(measureTasks.status, 'COMPLETED'),
            ));

        return apiSuccess({
            overview: {
                totalEarnings: parseFloat(installStats[0]?.totalFee || '0'),
                totalTasks: (installStats[0]?.completedCount || 0) + (measureStats[0]?.measureCount || 0),
            },
            monthly: {
                earnings: parseFloat(monthlyStats[0]?.monthlyFee || '0'),
                tasks: monthlyStats[0]?.monthlyCount || 0,
                period: `${now.getFullYear()}年${now.getMonth() + 1}月`,
            },
            pending: {
                earnings: parseFloat(pendingStats[0]?.pendingFee || '0'),
                tasks: pendingStats[0]?.pendingCount || 0,
            },
            breakdown: {
                installTasks: installStats[0]?.completedCount || 0,
                measureTasks: measureStats[0]?.measureCount || 0,
            },
        });

    } catch (error) {
        log.error('收入统计查询错误', {}, error);
        return apiError('查询收入统计失败', 500);
    }
}
