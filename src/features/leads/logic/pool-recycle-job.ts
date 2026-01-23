// 公海回收定时任务 - 内部业务逻辑（由 Cron 调用，非 Server Action）

import { db } from '@/shared/api/db';
import { leads, leadStatusHistory, tenants } from '@/shared/api/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';

/**
 * 租户 SLA 配置
 */
interface TenantSlaConfig {
    // 超时未联系回收阈值 (小时)，默认 24 小时
    noContactTimeoutHours: number;
    // 超时未成交回收阈值 (天)，默认 30 天
    noDealTimeoutDays: number;
    // 是否启用自动回收
    autoRecycleEnabled: boolean;
}

const DEFAULT_SLA: TenantSlaConfig = {
    noContactTimeoutHours: 24,
    noDealTimeoutDays: 30,
    autoRecycleEnabled: true
};

/**
 * 获取租户 SLA 配置
 */
async function getTenantSlaConfig(tenantId: string): Promise<TenantSlaConfig> {
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const settings = tenant?.settings as { leadSla?: Partial<TenantSlaConfig> } | null;
    return {
        ...DEFAULT_SLA,
        ...settings?.leadSla
    };
}

/**
 * 回收超时未联系的线索
 * 条件：已分配给销售，但分配后 X 小时内无跟进记录
 */
async function recycleNoContactLeads(tenantId: string, config: TenantSlaConfig): Promise<string[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - config.noContactTimeoutHours);

    // 查找需要回收的线索
    const leadsToRecycle = await db.query.leads.findMany({
        where: and(
            eq(leads.tenantId, tenantId),
            eq(leads.status, 'PENDING_FOLLOWUP'), // 已分配待跟进
            lt(leads.assignedAt, cutoffTime), // 分配时间超过阈值
            isNull(leads.lastActivityAt) // 无任何跟进记录
        ),
        columns: { id: true, leadNo: true, status: true }
    });

    const recycledIds: string[] = [];

    for (const lead of leadsToRecycle) {
        await db.transaction(async (tx) => {
            // 更新状态
            await tx.update(leads)
                .set({
                    status: 'PENDING_ASSIGNMENT',
                    assignedSalesId: null,
                    assignedAt: null
                })
                .where(eq(leads.id, lead.id));

            // 记录状态变更
            await tx.insert(leadStatusHistory).values({
                tenantId,
                leadId: lead.id,
                oldStatus: lead.status || 'PENDING_FOLLOWUP',
                newStatus: 'PENDING_ASSIGNMENT',
                reason: `自动回收：分配后 ${config.noContactTimeoutHours} 小时无跟进`
            });
        });

        recycledIds.push(lead.id);
    }

    return recycledIds;
}

/**
 * 回收超时未成交的线索
 * 条件：跟进中状态，但 Y 天内未转报价/未成交
 */
async function recycleNoDealLeads(tenantId: string, config: TenantSlaConfig): Promise<string[]> {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - config.noDealTimeoutDays);

    // 查找需要回收的线索
    const leadsToRecycle = await db.query.leads.findMany({
        where: and(
            eq(leads.tenantId, tenantId),
            eq(leads.status, 'FOLLOWING_UP'), // 跟进中
            lt(leads.lastActivityAt, cutoffTime), // 最后活动时间超过阈值
            isNull(leads.quotedAt) // 未报价
        ),
        columns: { id: true, leadNo: true, status: true }
    });

    const recycledIds: string[] = [];

    for (const lead of leadsToRecycle) {
        await db.transaction(async (tx) => {
            await tx.update(leads)
                .set({
                    status: 'PENDING_ASSIGNMENT',
                    assignedSalesId: null,
                    assignedAt: null
                })
                .where(eq(leads.id, lead.id));

            await tx.insert(leadStatusHistory).values({
                tenantId,
                leadId: lead.id,
                oldStatus: lead.status || 'FOLLOWING_UP',
                newStatus: 'PENDING_ASSIGNMENT',
                reason: `自动回收：跟进 ${config.noDealTimeoutDays} 天未转报价`
            });
        });

        recycledIds.push(lead.id);
    }

    return recycledIds;
}

/**
 * 执行公海回收任务
 * 应由定时任务定期调用 (建议每 2 小时一次)
 */
export async function executePoolRecycleJob(): Promise<{
    tenantId: string;
    noContactRecycled: number;
    noDealRecycled: number;
}[]> {
    // 获取所有启用自动回收的租户
    const allTenants = await db.query.tenants.findMany({
        columns: { id: true, settings: true }
    });

    const results: { tenantId: string; noContactRecycled: number; noDealRecycled: number }[] = [];

    for (const tenant of allTenants) {
        const config = await getTenantSlaConfig(tenant.id);

        if (!config.autoRecycleEnabled) continue;

        const noContactRecycled = await recycleNoContactLeads(tenant.id, config);
        const noDealRecycled = await recycleNoDealLeads(tenant.id, config);

        results.push({
            tenantId: tenant.id,
            noContactRecycled: noContactRecycled.length,
            noDealRecycled: noDealRecycled.length
        });
    }

    return results;
}

/**
 * 获取即将被回收的线索 (用于提醒)
 * 返回距离回收还有 24 小时内的线索
 */
export async function getLeadsAboutToRecycle(tenantId: string): Promise<{
    id: string;
    leadNo: string;
    hoursRemaining: number;
    recycleType: 'NO_CONTACT' | 'NO_DEAL';
}[]> {
    const config = await getTenantSlaConfig(tenantId);
    const now = new Date();

    const results: { id: string; leadNo: string; hoursRemaining: number; recycleType: 'NO_CONTACT' | 'NO_DEAL' }[] = [];

    // 检查即将因无跟进被回收的
    const noContactWarningTime = new Date();
    noContactWarningTime.setHours(noContactWarningTime.getHours() - (config.noContactTimeoutHours - 24));

    const noContactLeads = await db.query.leads.findMany({
        where: and(
            eq(leads.tenantId, tenantId),
            eq(leads.status, 'PENDING_FOLLOWUP'),
            lt(leads.assignedAt, noContactWarningTime),
            isNull(leads.lastActivityAt)
        ),
        columns: { id: true, leadNo: true, assignedAt: true }
    });

    for (const lead of noContactLeads) {
        if (!lead.assignedAt) continue;
        const deadline = new Date(lead.assignedAt);
        deadline.setHours(deadline.getHours() + config.noContactTimeoutHours);
        const hoursRemaining = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (hoursRemaining <= 24 && hoursRemaining > 0) {
            results.push({
                id: lead.id,
                leadNo: lead.leadNo,
                hoursRemaining: Math.round(hoursRemaining),
                recycleType: 'NO_CONTACT'
            });
        }
    }

    return results;
}
