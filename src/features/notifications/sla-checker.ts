// import { processApproval } from '../approval/actions/processing'; // 改成动态导入以规避 Vitest 中 next-auth 模块问题
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import {
    tenants, leads, notifications, measureTasks, users, approvalTasks
} from '@/shared/api/schema';
import { eq, and, or, lt, gte, isNull } from 'drizzle-orm';
import { notificationService } from './service';

interface TenantSettings {
    approvalAutoResumeHours?: number;
    approvalAutoApproveDays?: number;
    [key: string]: unknown;
}

/**
 * SLA 检查器
 * 运行规则检查并触发通知
 */
export const slaChecker = {
    async runAllChecks() {
        const results = await Promise.all([
            this.checkLeadFollowupSLA(),
            this.checkMeasureTaskDispatchSLA(),
            this.checkApprovalSLA(),
        ]);
        return results;
    },

    /**
     * 1. 线索跟进时效
     * 规则: 状态=PENDING_FOLLOWUP 且 (lastActivityAt < 24h 前 OR (lastActivityAt is NULL AND assignedAt < 24h 前))
     * 提醒: 销售
     */
    async checkLeadFollowupSLA() {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        // 1. 获取所有活跃租户
        const activeTenants = await db.query.tenants.findMany({
            where: eq(tenants.isActive, true)
        });

        let totalFound = 0;
        let totalSent = 0;

        for (const tenant of activeTenants) {
            const overdueLeads = await db.query.leads.findMany({
                where: and(
                    eq(leads.tenantId, tenant.id),
                    eq(leads.status, 'PENDING_FOLLOWUP'),
                    or(
                        lt(leads.lastActivityAt, threshold),
                        and(isNull(leads.lastActivityAt), lt(leads.assignedAt, threshold))
                    )
                ),
                with: {
                    assignedSales: true,
                }
            });

            totalFound += overdueLeads.length;

            // P1 优化：对该租户下最近 24h 的所有告警通知进行预加载，解决循环内 N+1 查询问题
            const recentWarnings = await db.query.notifications.findMany({
                where: and(
                    eq(notifications.tenantId, tenant.id),
                    eq(notifications.type, 'WARNING'),
                    gte(notifications.createdAt, threshold)
                ),
                columns: {
                    userId: true,
                    title: true,
                    content: true
                }
            });

            for (const lead of overdueLeads) {
                if (!lead.assignedSalesId) continue;

                // 内存中去重：检查该销售最近 24h 是否已收到过该线索的超时提醒
                const isAlreadyNotified = recentWarnings.some(n =>
                    n.userId === lead.assignedSalesId &&
                    n.title.includes('跟进超时') &&
                    n.content?.includes(lead.leadNo)
                );

                if (isAlreadyNotified) continue;

                await notificationService.send({
                    tenantId: tenant.id,
                    userId: lead.assignedSalesId,
                    type: 'WARNING',
                    title: '线索跟进超时提醒',
                    content: `线索 ${lead.leadNo} (${lead.customerName}) 已超过 24 小时未跟进，请及时处理。`,
                    link: `/crm/leads/${lead.id}`,
                    metadata: { leadId: lead.id, type: 'sla_lead_followup' }
                });
                totalSent++;
            }
        }
        return { type: 'LEAD_FOLLOWUP', found: totalFound, sent: totalSent };
    },

    /**
     * 2. 测量派单时效
     * 规则: 状态=PENDING (待派单) 且 createdAt < 24h 前
     * 提醒: 店长/派单员 (MANAGER)
     */
    async checkMeasureTaskDispatchSLA() {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        // 1. 获取所有活跃租户
        const activeTenants = await db.query.tenants.findMany({
            where: eq(tenants.isActive, true)
        });

        let totalFound = 0;
        let totalSent = 0;

        for (const tenant of activeTenants) {
            const overdueTasks = await db.query.measureTasks.findMany({
                where: and(
                    eq(measureTasks.tenantId, tenant.id),
                    eq(measureTasks.status, 'PENDING'),
                    lt(measureTasks.createdAt, threshold)
                )
            });

            if (overdueTasks.length === 0) continue;
            totalFound += overdueTasks.length;

            // Find Managers/Dispatchers within THIS tenant
            const managers = await db.query.users.findMany({
                where: and(
                    eq(users.tenantId, tenant.id),
                    eq(users.role, 'MANAGER')
                )
            });

            if (managers.length === 0) {
                logger.warn(`[SLAChecker] No managers found for tenant ${tenant.id} to receive dispatch alerts.`);
                continue;
            }

            // P1 优化：预加载该租户下所有待处理任务的警告通知，消除 N+1 查询
            // Note: The provided instruction's `existingWarnings` and `warningKeys` logic
            // seems to be for a different notification type (e.g., "即将逾期") or a different
            // deduplication strategy.
            // For "测量待派单超时警告", we need to check for notifications related to specific tasks.
            // The original N+1 query was checking for notifications for a specific user and task.
            // To optimize, we can fetch all relevant notifications for the tenant and then filter in memory.
            const recentWarnings = await db.query.notifications.findMany({
                where: and(
                    eq(notifications.tenantId, tenant.id),
                    eq(notifications.type, 'WARNING'),
                    gte(notifications.createdAt, threshold),
                    or(
                        eq(notifications.title, '测量待派单超时警告'),
                        eq(notifications.metadata, { type: 'sla_measure_dispatch' }) // More robust check
                    )
                ),
                columns: {
                    userId: true,
                    title: true,
                    content: true,
                    metadata: true
                }
            });

            // Create a set for quick lookup of already sent notifications for a specific task and user
            const notifiedTasksForUser = new Set<string>(); // Format: `${userId}:${taskId}`
            for (const notif of recentWarnings) {
                const meta = notif.metadata as { taskId?: string; type?: string };
                if (meta?.taskId && meta?.type === 'sla_measure_dispatch') {
                    notifiedTasksForUser.add(`${notif.userId}:${meta.taskId}`);
                } else if (notif.title.includes('测量待派单') && notif.content) {
                    // Fallback for older notifications or if metadata is missing
                    const match = notif.content.match(/测量任务 (\w+) 创建/);
                    if (match && match[1]) {
                        // This is less reliable as measureNo is not unique across tasks
                        // but we'll use it if taskId is not in metadata
                        const task = overdueTasks.find(t => t.measureNo === match[1]);
                        if (task) {
                            notifiedTasksForUser.add(`${notif.userId}:${task.id}`);
                        }
                    }
                }
            }

            for (const task of overdueTasks) {
                for (const manager of managers) {
                    // Check if this manager has already been notified about this specific task
                    if (notifiedTasksForUser.has(`${manager.id}:${task.id}`)) {
                        continue;
                    }

                    await notificationService.send({
                        tenantId: tenant.id,
                        userId: manager.id,
                        type: 'WARNING',
                        title: '测量待派单超时警告',
                        content: `测量任务 ${task.measureNo} 创建已超过 24 小时未派单，请立即处理。`,
                        link: `/service/measurement/${task.id}`,
                        metadata: { taskId: task.id, type: 'sla_measure_dispatch' }
                    });
                    totalSent++;
                }
            }
        }

        return { type: 'MEASURE_DISPATCH', found: totalFound, sent: totalSent };
    },

    /**
     * 3. 审批叫停与决策 SLA (租户级自定义支持)
     * 规则 A (自动恢复/标记): 状态=PAUSED 且超时 -> 标记 TIMEOUT 并提醒
     * 规则 B (强制决策): 状态=PENDING 且超时 -> 自动 APPROVE 
     */
    async checkApprovalSLA() {
        logger.info('[SLAChecker] Starting checkApprovalSLA');
        const activeTenants = await db.query.tenants.findMany({
            where: eq(tenants.isActive, true)
        });

        let totalResumeCount = 0;
        let totalAutoApproveCount = 0;
        const now = Date.now();

        let totalFound = 0;
        for (const tenant of activeTenants) {
            const settings = (tenant.settings as unknown as TenantSettings) || {};
            const resumeHours = Number(settings.approvalAutoResumeHours) || 48;
            const approveDays = Number(settings.approvalAutoApproveDays) || 7;

            const resumeThreshold = new Date(now - resumeHours * 60 * 60 * 1000);
            const approveThreshold = new Date(now - approveDays * 24 * 60 * 60 * 1000);

            logger.info(`[SLAChecker] Tenant: ${tenant.name} (${tenant.id}), approveDays: ${approveDays}, threshold: ${approveThreshold.toISOString()}`);

            // --- Rule A: Auto Timeout for Paused Tasks ---
            const pausedTasks = await db.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.tenantId, tenant.id),
                    eq(approvalTasks.status, 'PAUSED'),
                    lt(approvalTasks.createdAt, resumeThreshold)
                )
            });
            totalFound += pausedTasks.length;

            for (const task of pausedTasks) {
                // P1 修复：重新验证状态，防止 TOCTOU 竞态
                const currentTask = await db.query.approvalTasks.findFirst({
                    where: eq(approvalTasks.id, task.id),
                    columns: { status: true }
                });

                if (!currentTask || currentTask.status !== 'PAUSED') continue;

                await db.update(approvalTasks).set({
                    status: 'TIMEOUT',
                    actionAt: new Date(now)
                }).where(eq(approvalTasks.id, task.id));

                if (task.approverId) {
                    await notificationService.send({
                        tenantId: task.tenantId,
                        userId: task.approverId,
                        type: 'APPROVAL',
                        title: '审批暂停已超时',
                        content: `您的审批任务(ID: ${task.id.substring(0, 8)})已暂停超过 ${resumeHours} 小时，现已标记为超时，请检查原因。`,
                        metadata: { taskId: task.id }
                    });
                }
                totalResumeCount++;
            }

            // --- Rule B: Auto Approve for Long Pending Tasks ---
            const longPendingTasks = await db.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.tenantId, tenant.id),
                    eq(approvalTasks.status, 'PENDING'),
                    lt(approvalTasks.createdAt, approveThreshold)
                )
            });
            logger.info(`[SLAChecker] Found ${longPendingTasks.length} long pending tasks for Rule B`);
            totalFound += longPendingTasks.length;

            for (const task of longPendingTasks) {
                console.log('LOOP ENTERED, TASK ID:', task.id);
                logger.info(`[SLAChecker] Auto-approving task ${task.id} for tenant ${tenant.name} due to ${approveDays}-day SLA`);

                try {
                    // P0 修复：重新验证任务状态，防止 TOCTOU 竞态
                    const currentTask = await db.query.approvalTasks.findFirst({
                        where: eq(approvalTasks.id, task.id)
                    });
                    console.log('FIND FIRST RESULT:', currentTask?.id, currentTask?.status);

                    if (!currentTask || currentTask.status !== 'PENDING') {
                        logger.warn(`[SLAChecker] Task ${task.id} status changed, skipping auto-approval. Status: ${currentTask?.status}`);
                        continue;
                    }
                    console.log('PROCEEDING TO AUTO-APPROVE');
                    logger.info(`[SLAChecker] Proceeding to auto-approve task ${task.id}`);

                    const { processApproval } = await import('../approval/actions/processing');
                    await processApproval({
                        taskId: task.id,
                        action: 'APPROVE',
                        comment: `[系统] 超过 ${approveDays} 天未响应，根据租户 SLA 配置自动核准通过。`
                    });
                    totalAutoApproveCount++;
                } catch (err) {
                    logger.error(`[SLAChecker] Failed to auto-approve task ${task.id}:`, err);
                }
            }
        }

        return {
            type: 'APPROVAL_SLA',
            found: totalFound,
            sent: totalResumeCount + totalAutoApproveCount
        };
    }
};
