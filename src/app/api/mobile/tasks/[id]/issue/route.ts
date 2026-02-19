/**
 * 工人端 - 异常问题上报 API
 * POST /api/mobile/tasks/:id/issue
 * 
 * 工人在施工现场发现异常问题时，可通过此接口上报。
 * 支持文字描述 + 图片证据 + 严重程度分级。
 */

import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('mobile:tasks:issue');
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireWorker } from '@/shared/middleware/mobile-auth';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 问题上报请求校验 Schema
 */
const issueSchema = z.object({
    /** 问题描述 */
    description: z.string().min(10, '问题描述至少10个字符').max(1000, '问题描述不超过1000个字符'),
    /** 严重程度 */
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
        message: '严重程度必须为 LOW/MEDIUM/HIGH',
    }),
    /** 现场照片 URL 列表 */
    photoUrls: z.array(z.string().url('无效的图片URL')).max(10, '最多上传10张图片').optional(),
});

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    // 1. 认证
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;
    const session = auth.session;

    // 2. 权限检查 — 仅工人角色
    const isWorker = requireWorker(session);
    if (!isWorker.allowed) return isWorker.response;

    // 3. 获取路径参数
    const params = await props.params;
    const taskId = params.id;

    // 4. 校验请求体
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const parseResult = issueSchema.safeParse(body);
    if (!parseResult.success) {
        return apiError('参数校验失败', 400, parseResult.error.flatten().fieldErrors);
    }

    const { description, severity, photoUrls = [] } = parseResult.data;

    // 5. 查找任务（先查测量任务，再查安装任务）
    let taskType: 'measure' | 'install' = 'measure';
    let found = false;
    let taskStatus: string | null = null;

    const measureTask = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.assignedWorkerId, session.userId),
            eq(measureTasks.tenantId, session.tenantId)
        ),
        columns: { id: true, status: true },
    });

    if (measureTask) {
        found = true;
        taskStatus = measureTask.status;
    } else {
        taskType = 'install';
        const installTask = await db.query.installTasks.findFirst({
            where: and(
                eq(installTasks.id, taskId),
                eq(installTasks.installerId, session.userId),
                eq(installTasks.tenantId, session.tenantId)
            ),
            columns: { id: true, status: true },
        });
        if (installTask) {
            found = true;
            taskStatus = installTask.status;
        }
    }

    if (!found) {
        return apiNotFound('任务不存在或不属于您');
    }

    // 6. 记录问题信息到任务的 fieldDiscovery / remark 字段
    const issueRecord = {
        description,
        severity,
        photoUrls,
        reportedBy: session.userId,
        reportedAt: new Date().toISOString(),
    };

    if (taskType === 'measure') {
        // 测量任务：追加到 remark 字段
        await db.update(measureTasks)
            .set({
                remark: JSON.stringify(issueRecord),
                updatedAt: new Date(),
            })
            .where(eq(measureTasks.id, taskId));
    } else {
        // 安装任务：使用 fieldDiscovery JSON 字段
        await db.update(installTasks)
            .set({
                fieldDiscovery: issueRecord,
                updatedAt: new Date(),
            })
            .where(eq(installTasks.id, taskId));
    }

    // 记录审计日志并记录日志
    log.info('Task Issue Reported', { taskId, taskType, severity });
    await AuditService.log(db, {
        tableName: taskType === 'measure' ? 'measure_tasks' : 'install_tasks',
        recordId: taskId,
        action: 'TASK_ISSUE_REPORT',
        userId: session.userId,
        tenantId: session.tenantId,
        details: issueRecord,
        traceId: session.traceId,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
    });

    // 7. 返回结果
    return apiSuccess(
        {
            taskId,
            taskType,
            taskStatus,
            issue: {
                description,
                severity,
                photoCount: photoUrls.length,
                reportedAt: issueRecord.reportedAt,
            },
        },
        '问题已上报'
    );
}
