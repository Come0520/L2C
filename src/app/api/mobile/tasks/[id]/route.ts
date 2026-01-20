/**
 * 移动端 - 任务详情 API
 * GET /api/mobile/tasks/:id
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';

interface TaskDetailParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: TaskDetailParams) {
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

    const { id: taskId } = await params;

    try {
        // 3. 查找任务（先查测量，再查安装）
        let taskType: 'measure' | 'install' = 'measure';
        let detail = null;

        // 尝试查找测量任务
        const measureTask = await db.query.measureTasks.findFirst({
            where: and(
                eq(measureTasks.id, taskId),
                eq(measureTasks.assignedWorkerId, session.userId)
            ),
            with: {
                customer: {
                    columns: {
                        name: true,
                        phone: true,
                    },
                    with: {
                        addresses: true // 获取地址列表
                    }
                },
                sheets: {
                    with: {
                        items: true
                    }
                }
            }
        });

        if (measureTask) {
            detail = measureTask;
        } else {
            // 尝试查找安装任务
            taskType = 'install';
            const installTask = await db.query.installTasks.findFirst({
                where: and(
                    eq(installTasks.id, taskId),
                    eq(installTasks.installerId, session.userId)
                ),
                with: {
                    customer: {
                        columns: {
                            name: true,
                            phone: true,
                        },
                        with: {
                            addresses: true
                        }
                    },
                    order: {
                        columns: {
                            orderNo: true,
                        }
                    },
                    items: true
                }
            });
            if (installTask) {
                detail = installTask;
            }
        }

        if (!detail) {
            return apiNotFound('任务不存在或不属于您');
        }

        // 4. 返回详情
        return apiSuccess({
            taskId,
            taskType,
            ...detail,
        });

    } catch (error) {
        console.error('任务详情查询错误:', error);
        return apiError('查询任务详情失败', 500);
    }
}
