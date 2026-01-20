/**
 * 客户端 - 安装进度 API
 * GET /api/mobile/orders/:id/install-progress
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, installTasks, customers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';

interface ProgressParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: ProgressParams) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireCustomer(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    const { id: orderId } = await params;

    try {
        // 3. 验证订单归属
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, session.phone),
            columns: { id: true }
        });

        if (!customer) {
            return apiNotFound('客户信息不存在');
        }

        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.customerId, customer.id)
            ),
            columns: {
                id: true,
                orderNo: true,
                status: true,
            }
        });

        if (!order) {
            return apiNotFound('订单不存在');
        }

        // 4. 查询安装任务
        const tasks = await db.query.installTasks.findMany({
            where: eq(installTasks.orderId, orderId),
            columns: {
                id: true,
                taskNo: true,
                status: true,
                category: true,
                scheduledDate: true,
                scheduledTimeSlot: true,
                installerName: true,
                completedAt: true,
                rating: true,
            }
        });

        // 5. 构建进度节点
        const progressNodes = buildProgressNodes(order.status || '', tasks.map(t => ({
            status: t.status || '',
            scheduledDate: t.scheduledDate,
            completedAt: t.completedAt,
        })));

        return apiSuccess({
            orderId,
            orderNo: order.orderNo,
            orderStatus: order.status,
            progress: progressNodes,
            installTasks: tasks.map(t => ({
                id: t.id,
                taskNo: t.taskNo,
                status: t.status,
                statusText: getInstallStatusText(t.status || ''),
                category: t.category,
                scheduledDate: t.scheduledDate,
                scheduledTimeSlot: t.scheduledTimeSlot,
                installerName: t.installerName,
                completedAt: t.completedAt?.toISOString(),
                hasRating: !!t.rating,
            })),
        });

    } catch (error) {
        console.error('安装进度查询错误:', error);
        return apiError('查询安装进度失败', 500);
    }
}

/**
 * 构建进度节点
 */
interface ProgressNode {
    step: number;
    name: string;
    status: 'completed' | 'current' | 'pending';
    time?: string;
}

function buildProgressNodes(orderStatus: string, tasks: Array<{ status: string; scheduledDate: Date | null; completedAt: Date | null }>): ProgressNode[] {
    const nodes: ProgressNode[] = [
        { step: 1, name: '待安装', status: 'pending' },
        { step: 2, name: '已预约', status: 'pending' },
        { step: 3, name: '安装中', status: 'pending' },
        { step: 4, name: '安装完成', status: 'pending' },
        { step: 5, name: '已评价', status: 'pending' },
    ];

    // 根据订单和任务状态更新节点
    const completedStatuses = ['COMPLETED', 'PENDING_CONFIRM'];
    const inProgressStatuses = ['PENDING_VISIT', 'IN_PROGRESS'];
    const scheduledStatuses = ['DISPATCHING', 'PENDING_VISIT'];

    // 检查是否有任务
    if (tasks.length === 0) {
        nodes[0].status = 'current';
        return nodes;
    }

    // 检查各阶段
    const hasScheduled = tasks.some(t => scheduledStatuses.includes(t.status) || t.scheduledDate);
    const hasInProgress = tasks.some(t => inProgressStatuses.includes(t.status));
    const allCompleted = tasks.every(t => completedStatuses.includes(t.status));

    if (allCompleted) {
        nodes[0].status = 'completed';
        nodes[1].status = 'completed';
        nodes[2].status = 'completed';
        nodes[3].status = 'completed';
        nodes[4].status = 'current';

        const completedTask = tasks.find(t => t.completedAt);
        if (completedTask?.completedAt) {
            nodes[3].time = completedTask.completedAt.toISOString();
        }
    } else if (hasInProgress) {
        nodes[0].status = 'completed';
        nodes[1].status = 'completed';
        nodes[2].status = 'current';
    } else if (hasScheduled) {
        nodes[0].status = 'completed';
        nodes[1].status = 'current';

        const scheduledTask = tasks.find(t => t.scheduledDate);
        if (scheduledTask?.scheduledDate) {
            nodes[1].time = scheduledTask.scheduledDate.toISOString();
        }
    } else {
        nodes[0].status = 'current';
    }

    return nodes;
}

/**
 * 安装状态文本
 */
function getInstallStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'PENDING_DISPATCH': '待分配',
        'DISPATCHING': '待接单',
        'PENDING_VISIT': '待上门',
        'IN_PROGRESS': '安装中',
        'PENDING_CONFIRM': '待验收',
        'COMPLETED': '已完成',
    };
    return statusMap[status] || status;
}
