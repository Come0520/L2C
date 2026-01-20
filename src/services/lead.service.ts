import { db } from "@/shared/api/db";
import { leads, channels } from "@/shared/api/schema";
import { eq, and, sql, notInArray } from "drizzle-orm";
import { CustomerService } from "./customer.service";
import { randomBytes } from 'crypto';
import { format } from 'date-fns';

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
    static async createLead(data: typeof leads.$inferInsert, tenantId: string, userId: string): Promise<{
        isDuplicate: boolean;
        duplicateReason?: 'PHONE' | 'ADDRESS';
        lead: any; // Type inference helper
    }> {

        // 1. Check Active Lead Uniqueness
        // Only block if the lead exists and is active (not WON or VOID)
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

        // 2. 地址/楼盘唯一性检查（第二识别键）
        // 仅对活跃线索做拦截，已关闭的线索允许重复地址
        if (data.community && data.address) {
            const existingAddress = await db.query.leads.findFirst({
                where: and(
                    eq(leads.community, data.community),
                    eq(leads.address, data.address),
                    eq(leads.tenantId, tenantId),
                    notInArray(leads.status, ['WON', 'VOID']) // 修复：仅检查活跃线索
                )
            });
            if (existingAddress) {
                return { isDuplicate: true, duplicateReason: 'ADDRESS', lead: existingAddress };
            }
        }

        // 3. Auto-link to existing customer
        let customerId = data.customerId;
        if (!customerId && data.customerPhone) {
            const existingCustomer = await CustomerService.findByPhone(data.customerPhone);
            if (existingCustomer) {
                customerId = existingCustomer.id;
            }
        }

        // 5. 自动分配策略 (Round Robin / Load Balance)
        // 尝试获取分配建议
        let assignedSalesId = data.assignedSalesId || null;
        let initialStatus = 'PENDING_ASSIGNMENT';

        // 如果没有指定销售，且未成交，尝试自动分配
        if (!assignedSalesId && initialStatus === 'PENDING_ASSIGNMENT') {
            try {
                // 动态导入以避免循环依赖 (如果 logic 引用了 service)
                const { distributeToNextSales } = await import('@/features/leads/logic/distribution-engine');
                const distribution = await distributeToNextSales(tenantId);

                if (distribution.salesId) {
                    assignedSalesId = distribution.salesId;
                    initialStatus = 'PENDING_FOLLOWUP';
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
                status: initialStatus as any,
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
