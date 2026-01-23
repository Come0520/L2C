import { db } from "@/shared/api/db";
import { leads, channels } from "@/shared/api/schema";
import { eq, and, sql, notInArray } from "drizzle-orm";
import { CustomerService } from "./customer.service";
import { randomBytes } from 'crypto';
import { format } from 'date-fns';
import { getSetting } from "@/features/settings/actions/system-settings-actions";

export class LeadService {

    /**
     * Generates a unique Lead No.
     * Format: LD + YYYYMMDD + 6 hex chars
     */
    private static async generateLeadNo() {
        const prefix = `LD${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    /**
     * Create a new lead with duplicate check, auto-linking, and stats update.
     * @param data Lead data (partial)
     * @param tenantId Tenant ID
     * @param userId Creator User ID
     */
    static async createLead(data: Omit<typeof leads.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'leadNo' | 'createdBy' | 'assignedSalesId' | 'assignedAt' | 'status'>, tenantId: string, userId: string): Promise<{
        isDuplicate: boolean;
        duplicateReason?: 'PHONE' | 'ADDRESS';
        lead: typeof leads.$inferSelect;
    }> {

        // 读取消重配置（使用统一的键名 LEAD_DUPLICATE_STRATEGY）
        const deduplicationSetting = await getSetting('LEAD_DUPLICATE_STRATEGY') as string;
        // 消重策略：NONE=不校验, AUTO_LINK=自动关联(复用为查重), REJECT=拒绝
        if (deduplicationSetting !== 'NONE') {
            const activeLead = await db.query.leads.findFirst({
                where: and(
                    eq(leads.customerPhone, data.customerPhone),
                    eq(leads.tenantId, tenantId),
                    notInArray(leads.status, ['WON', 'VOID'])
                )
            });

            if (activeLead) {
                return { isDuplicate: true, duplicateReason: 'PHONE', lead: activeLead };
            }
            // 地址查重：检查是否启用了第二键查重
            const enableSecondKeyCheck = await getSetting('ENABLE_SECOND_KEY_DUPLICATE_CHECK') as boolean;
            if (enableSecondKeyCheck && data.community && data.address) {
                const existingAddress = await db.query.leads.findFirst({
                    where: and(
                        eq(leads.community, data.community),
                        eq(leads.address, data.address),
                        eq(leads.tenantId, tenantId),
                        notInArray(leads.status, ['WON', 'VOID'])
                    )
                });
                if (existingAddress) {
                    return { isDuplicate: true, duplicateReason: 'ADDRESS', lead: existingAddress };
                }
            }
        }

        // 3. Auto-link to existing customer
        let customerId = data.customerId;
        if (!customerId && data.customerPhone) {
            const existingCustomer = await CustomerService.findByPhone(data.customerPhone, tenantId);
            if (existingCustomer) {
                customerId = existingCustomer.id;
            }
        }

        // 5. 自动分配策略 (Round Robin / Load Balance)
        // 尝试获取分配建议
        let assignedSalesId = null;
        let initialStatus: typeof leads.$inferInsert['status'] = 'PENDING_ASSIGNMENT';

        // 如果没有指定销售，且未成交，尝试自动分配
        if (!assignedSalesId && initialStatus === 'PENDING_ASSIGNMENT') {
            try {
                // 读取自动分配配置（使用统一的键名 LEAD_AUTO_ASSIGN_RULE）
                const assignRule = await getSetting('LEAD_AUTO_ASSIGN_RULE') as string;

                if (assignRule !== 'MANUAL') {
                    // 动态导入以避免循环依赖
                    const { distributeToNextSales } = await import('@/features/leads/logic/distribution-engine');
                    const distribution = await distributeToNextSales(tenantId);

                    if (distribution.salesId) {
                        assignedSalesId = distribution.salesId;
                        initialStatus = 'PENDING_FOLLOWUP';
                    }
                }
            } catch (error) {
                console.error('Auto-distribution failed:', error);
                // 降级处理：保持未分配
            }
        }

        // 6. Generate Lead No
        const leadNo = await this.generateLeadNo();

        // 7. Create Lead
        // Wrap in transaction for stats consistency
        const newLead = await db.transaction(async (tx) => {
            const [lead] = await tx.insert(leads).values({
                ...data,
                leadNo,
                customerId: customerId,
                tenantId: tenantId,
                createdBy: userId,
                status: initialStatus,
                assignedSalesId: assignedSalesId,
                assignedAt: assignedSalesId ? new Date() : null,
            }).returning();

            // 8. Update Channel Statistics
            if (data.channelId) {
                await tx.update(channels)
                    .set({ totalLeads: sql`${channels.totalLeads} + 1` })
                    .where(and(eq(channels.id, data.channelId), eq(channels.tenantId, tenantId)));
            }

            return lead;
        });

        return { isDuplicate: false, lead: newLead };
    }
}
