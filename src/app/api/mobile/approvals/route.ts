/**
 * 老板端 - 审批列表 API
 * GET /api/mobile/approvals
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { apiError, apiPaginated } from '@/shared/lib/api-response';
import { authenticateMobile, requireBoss } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';


const log = createLogger('mobile/approvals');
export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireBoss(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';  // PENDING | COMPLETED
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    try {
        // 4. 构建查询条件
        const conditions = [
            eq(approvalTasks.tenantId, session.tenantId),
            eq(approvalTasks.approverId, session.userId),
        ];

        if (status === 'PENDING') {
            conditions.push(eq(approvalTasks.status, 'PENDING'));
        } else {
            conditions.push(
                or(
                    eq(approvalTasks.status, 'APPROVED'),
                    eq(approvalTasks.status, 'REJECTED')
                )!
            );
        }

        // 5. 查询审批列表（关联 approval 获取 requester 和类型信息）
        const tasks = await db.query.approvalTasks.findMany({
            where: and(...conditions),
            orderBy: [desc(approvalTasks.createdAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            columns: {
                id: true,
                status: true,
                comment: true,
                createdAt: true,
                actionAt: true,
            },
            with: {
                approval: {
                    columns: {
                        entityType: true,
                    },
                    with: {
                        requester: {
                            columns: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        // 6. 统计总数
        const allTasks = await db.query.approvalTasks.findMany({
            where: and(...conditions),
            columns: { id: true }
        });
        const total = allTasks.length;

        // 7. 格式化响应
        const items = tasks.map(task => ({
            id: task.id,
            status: task.status,
            statusText: getStatusText(task.status),
            type: task.approval?.entityType,
            typeText: getTypeText(task.approval?.entityType ?? null),
            requester: task.approval?.requester ? {
                id: task.approval.requester.id,
                name: task.approval.requester.name,
            } : null,
            comment: task.comment,
            createdAt: task.createdAt?.toISOString(),
            processedAt: task.actionAt?.toISOString(),
        }));

        return apiPaginated(items, page, pageSize, total);

    } catch (error) {
        log.error('审批列表查询错误', {}, error);
        return apiError('查询审批列表失败', 500);
    }
}

function getTypeText(type: string | null): string {
    const map: Record<string, string> = {
        'QUOTE_DISCOUNT': '折扣审批',
        'ORDER_CHANGE': '订单变更',
        'REFUND': '退款审批',
        'EXPENSE': '费用报销',
        'FREE_MEASURE': '免费测量',
    };
    return map[type || ''] || type || '';
}

function getStatusText(status: string | null): string {
    const map: Record<string, string> = {
        'PENDING': '待审批',
        'APPROVED': '已通过',
        'REJECTED': '已驳回',
    };
    return map[status || ''] || status || '';
}
