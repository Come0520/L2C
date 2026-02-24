import { db, type DbTransaction } from "@/shared/api/db";
import { leads, leadStatusHistory } from "@/shared/api/schema/leads";
import { tenants } from "@/shared/api/schema/infrastructure";
import { and, eq, lte, isNotNull, inArray } from "drizzle-orm";
import { logger } from "@/shared/lib/logger";

interface LeadSlaSettings {
    autoRecycleEnabled?: boolean;
    noContactDays?: number;
    noDealDays?: number;
}

interface TenantSettings {
    leadSla?: LeadSlaSettings;
    [key: string]: unknown;
}

/**
 * 批量回收线索的共用函数
 *
 * 将一批超期线索在单个事务中批量回收至公海，减少 DB 开销。
 *
 * @param staleLeads - 需要回收的线索列表
 * @param tenantId - 租户 ID
 * @param oldStatus - 原始状态
 * @param reason - 回收原因描述
 * @returns 成功回收的数量和错误信息
 */
async function recycleLeadBatch(
    staleLeads: { id: string }[],
    tenantId: string,
    oldStatus: string,
    reason: string
): Promise<{ recycled: number; errors: string[] }> {
    const errors: string[] = [];
    if (staleLeads.length === 0) return { recycled: 0, errors };

    try {
        const leadIds = staleLeads.map(l => l.id);

        await db.transaction(async (tx: DbTransaction) => {
            // 批量更新状态
            await tx.update(leads)
                .set({
                    status: 'PENDING_ASSIGNMENT' as typeof leads.$inferSelect['status'],
                    assignedSalesId: null,
                    assignedAt: null,
                    updatedBy: null // 系统回收
                })
                .where(inArray(leads.id, leadIds));

            // 批量插入状态变更历史
            await tx.insert(leadStatusHistory)
                .values(leadIds.map(id => ({
                    tenantId,
                    leadId: id,
                    oldStatus,
                    newStatus: 'POOL',
                    reason
                })));
        });

        return { recycled: staleLeads.length, errors };
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        errors.push(`批量回收失败 (${staleLeads.length} 条): ${errorMsg}`);
        logger.error('[leads][cron] 批量回收异常', { count: staleLeads.length, oldStatus, error: errorMsg });
        return { recycled: 0, errors };
    }
}

/**
 * 线索公海自动回收任务
 *
 * 逻辑：
 * 1. 扫描所有租户的 SLA 配置
 * 2. 对超期未联系 (PENDING_FOLLOWUP) 的线索进行批量回收
 * 3. 对超期未成交 (FOLLOWING_UP) 的线索进行批量回收
 * 4. 回收操作：status -> PENDING_ASSIGNMENT, assignedSalesId -> null, 记录历史
 */
export async function executePoolRecycleJob() {
    const startTime = Date.now();
    let totalProcessed = 0;
    let recycledNoContact = 0;
    let recycledNoDeal = 0;
    const errors: string[] = [];

    try {
        // 1. 获取所有活跃租户
        const activeTenants = await db.query.tenants.findMany({
            where: eq(tenants.isActive, true)
        });

        for (const tenant of activeTenants) {
            const settings = (tenant.settings as TenantSettings) || {};
            const sla = settings.leadSla || {};

            if (!sla.autoRecycleEnabled) continue;

            const tenantId = tenant.id;
            const noContactDays = sla.noContactDays || 3;
            const noDealDays = sla.noDealDays || 7;

            // 2. 批量回收超期未联系线索
            const noContactThreshold = new Date(Date.now() - noContactDays * 24 * 3600 * 1000);
            const staleNoContactLeads = await db.query.leads.findMany({
                where: and(
                    eq(leads.tenantId, tenantId),
                    eq(leads.status, 'PENDING_FOLLOWUP'),
                    lte(leads.assignedAt, noContactThreshold),
                    isNotNull(leads.assignedSalesId)
                ),
                columns: { id: true }
            });

            const noContactResult = await recycleLeadBatch(
                staleNoContactLeads,
                tenantId,
                'PENDING_FOLLOWUP',
                `系统自动回收：超过 ${noContactDays} 天未联系`
            );
            recycledNoContact += noContactResult.recycled;
            totalProcessed += noContactResult.recycled;
            errors.push(...noContactResult.errors);

            // 3. 批量回收超期未成交线索
            const noDealThreshold = new Date(Date.now() - noDealDays * 24 * 3600 * 1000);
            const staleNoDealLeads = await db.query.leads.findMany({
                where: and(
                    eq(leads.tenantId, tenantId),
                    eq(leads.status, 'FOLLOWING_UP'),
                    lte(leads.assignedAt, noDealThreshold),
                    isNotNull(leads.assignedSalesId)
                ),
                columns: { id: true }
            });

            const noDealResult = await recycleLeadBatch(
                staleNoDealLeads,
                tenantId,
                'FOLLOWING_UP',
                `系统自动回收：超过 ${noDealDays} 天未成交`
            );
            recycledNoDeal += noDealResult.recycled;
            totalProcessed += noDealResult.recycled;
            errors.push(...noDealResult.errors);
        }

        logger.info('[leads][cron] 公海回收完成', { durationMs: Date.now() - startTime, totalProcessed, recycledNoContact, recycledNoDeal });
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        logger.error('[leads][cron] 公海回收异常', { error: errorMsg });
        errors.push(errorMsg);
    }

    return {
        totalProcessed,
        recycledNoContact,
        recycledNoDeal,
        errors,
    };
}
