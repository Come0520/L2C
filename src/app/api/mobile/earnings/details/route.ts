/**
 * 工人端 - 收入明细 API
 * GET /api/mobile/earnings/details
 * 
 * 查询工费明细记录
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks, measureTasks } from '@/shared/api/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { apiSuccess, apiError, apiPaginated } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

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

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    try {
        // 4. 构建查询条件
        const conditions = [
            eq(installTasks.installerId, workerId),
            eq(installTasks.status, 'COMPLETED'),
        ];

        if (startDate) {
            conditions.push(gte(installTasks.completedAt, new Date(startDate)));
        }
        if (endDate) {
            conditions.push(lte(installTasks.completedAt, new Date(endDate)));
        }

        // 5. 查询安装任务工费明细
        const tasks = await db.query.installTasks.findMany({
            where: and(...conditions),
            orderBy: [desc(installTasks.completedAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            with: {
                customer: {
                    columns: {
                        name: true,
                    }
                }
            },
            columns: {
                id: true,
                taskNo: true,
                address: true,
                category: true,
                actualLaborFee: true,
                completedAt: true,
            }
        });

        // 6. 统计总数
        const allTasks = await db.query.installTasks.findMany({
            where: and(...conditions),
            columns: { id: true }
        });
        const total = allTasks.length;

        // 7. 格式化响应
        const details = tasks.map(task => ({
            id: task.id,
            taskNo: task.taskNo,
            type: 'install' as const,
            category: task.category,
            customerName: task.customer?.name || '未知客户',
            address: task.address,
            fee: task.actualLaborFee ? parseFloat(String(task.actualLaborFee)) : 0,
            completedAt: task.completedAt?.toISOString(),
            status: 'settled', // 简化处理，实际应有结算状态
        }));

        return apiPaginated(details, page, pageSize, total);

    } catch (error) {
        console.error('收入明细查询错误:', error);
        return apiError('查询收入明细失败', 500);
    }
}
