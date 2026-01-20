import { db } from '@/shared/api/db';
import { leads, measureTasks, users, approvalTasks, tenants } from '@/shared/api/schema';
import { eq, and, lt, isNull, or } from 'drizzle-orm';
import { notificationService } from './service';
import { processApproval } from '../approval/actions/processing';

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
        console.log('[SLAChecker] Starting SLA checks...');
        const results = await Promise.all([
            this.checkLeadFollowupSLA(),
            this.checkMeasureTaskDispatchSLA(),
            this.checkApprovalSLA(),
        ]);
        console.log('[SLAChecker] SLA checks completed.', results);
        return results;
    },

    /**
     * 1. 线索跟进时效
     * 规则: 状态=PENDING_FOLLOWUP 且 (lastActivityAt < 24h 前 OR (lastActivityAt is NULL AND assignedAt < 24h 前))
     * 提醒: 销售
     */
    async checkLeadFollowupSLA() {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const overdueLeads = await db.query.leads.findMany({
            where: and(
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

        console.log(`[SLAChecker] Found ${overdueLeads.length} overdue leads.`);

        let sentCount = 0;
        for (const lead of overdueLeads) {
            if (!lead.assignedSalesId) continue;

            // TODO: check if recently notified to prevent spam (implied requirement, skipping for V1)

            await notificationService.send({
                tenantId: lead.tenantId,
                userId: lead.assignedSalesId,
                type: 'WARNING',
                title: '线索跟进超时提醒',
                content: `线索 ${lead.leadNo} (${lead.customerName}) 已超过 24 小时未跟进，请及时处理。`,
                link: `/leads/${lead.id}`,
                metadata: { leadId: lead.id, type: 'sla_lead_followup' }
            });
            sentCount++;
        }
        return { type: 'LEAD_FOLLOWUP', found: overdueLeads.length, sent: sentCount };
    },

    /**
     * 2. 测量派单时效
     * 规则: 状态=PENDING (待派单) 且 createdAt < 24h 前
     * 提醒: 店长/派单员 (MANAGER)
     */
    async checkMeasureTaskDispatchSLA() {
        const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const overdueTasks = await db.query.measureTasks.findMany({
            where: and(
                eq(measureTasks.status, 'PENDING'),
                lt(measureTasks.createdAt, threshold)
            )
        });

        console.log(`[SLAChecker] Found ${overdueTasks.length} overdue measure tasks.`);

        if (overdueTasks.length === 0) return { type: 'MEASURE_DISPATCH', found: 0, sent: 0 };

        // Find Managers/Dispatchers to notify
        // Assuming 'MANAGER' role handles dispatching
        const managers = await db.query.users.findMany({
            where: eq(users.role, 'MANAGER')
        });

        if (managers.length === 0) {
            console.warn('[SLAChecker] No managers found to receive dispatch alerts.');
            return { type: 'MEASURE_DISPATCH', found: overdueTasks.length, sent: 0 };
        }

        let sentCount = 0;
        for (const task of overdueTasks) {
            // Broadcast to all managers
            for (const manager of managers) {
                await notificationService.send({
                    tenantId: task.tenantId,
                    userId: manager.id,
                    type: 'WARNING',
                    title: '测量待派单超时警告',
                    content: `测量任务 ${task.measureNo} 创建已超过 24 小时未派单，请立即处理。`,
                    link: `/service/measurement/${task.id}`,
                    metadata: { taskId: task.id, type: 'sla_measure_dispatch' }
                });
                sentCount++;
            }
        }

        return { type: 'MEASURE_DISPATCH', found: overdueTasks.length, sent: sentCount };
    },

    /**
     * 3. 审批叫停与决策 SLA (租户级自定义支持)
     * 规则 A (自动恢复/标记): 状态=PAUSED 且超时 -> 标记 TIMEOUT 并提醒
     * 规则 B (强制决策): 状态=PENDING 且超时 -> 自动 APPROVE 
     */
    async checkApprovalSLA() {
        const activeTenants = await db.query.tenants.findMany({
            where: eq(tenants.isActive, true)
        });

        let totalResumeCount = 0;
        let totalAutoApproveCount = 0;
        const now = Date.now();

        for (const tenant of activeTenants) {
            const settings = (tenant.settings as unknown as TenantSettings) || {};
            const resumeHours = Number(settings.approvalAutoResumeHours) || 48;
            const approveDays = Number(settings.approvalAutoApproveDays) || 7;

            const resumeThreshold = new Date(now - resumeHours * 60 * 60 * 1000);
            const approveThreshold = new Date(now - approveDays * 24 * 60 * 60 * 1000);

            // --- Rule A: Auto Timeout for Paused Tasks ---
            const pausedTasks = await db.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.tenantId, tenant.id),
                    eq(approvalTasks.status, 'PAUSED'),
                    lt(approvalTasks.createdAt, resumeThreshold)
                )
            });

            for (const task of pausedTasks) {
                await db.update(approvalTasks).set({
                    status: 'TIMEOUT',
                    actionAt: new Date(now)
                }).where(eq(approvalTasks.id, task.id));

                if (task.approverId) {
                    await notificationService.send({
                        tenantId: task.tenantId,
                        userId: task.approverId,
                        type: 'WARNING',
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

            for (const task of longPendingTasks) {
                console.log(`[SLAChecker] Auto-approving task ${task.id} for tenant ${tenant.name} due to ${approveDays}-day SLA`);

                try {
                    await processApproval({
                        taskId: task.id,
                        action: 'APPROVE',
                        comment: `[系统] 超过 ${approveDays} 天未响应，根据租户 SLA 配置自动核准通过。`
                    });
                    totalAutoApproveCount++;
                } catch (err) {
                    console.error(`[SLAChecker] Failed to auto-approve task ${task.id}:`, err);
                }
            }
        }

        return { type: 'APPROVAL_SLA', resumed: totalResumeCount, autoApproved: totalAutoApproveCount };
    }
};
