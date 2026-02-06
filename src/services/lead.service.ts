import { db } from "@/shared/api/db";
import { leads, channels, leadActivities, leadStatusHistory, customers } from "@/shared/api/schema";
import { eq, and, sql, notInArray, desc } from "drizzle-orm";
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
        const deduplicationSetting = await getSetting('LEAD_DUPLICATE_STRATEGY', tenantId) as string;
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
            const enableSecondKeyCheck = await getSetting('ENABLE_SECOND_KEY_DUPLICATE_CHECK', tenantId) as boolean;
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
                const assignRule = await getSetting('LEAD_AUTO_ASSIGN_RULE', tenantId) as string;

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

    /**
     * Get lead detail by ID.
     */
    static async getLead(id: string, tenantId: string) {
        const lead = await db.query.leads.findFirst({
            where: and(eq(leads.id, id), eq(leads.tenantId, tenantId)),
            with: {
                assignedSales: true,
                sourceChannel: true,
                sourceSub: true,
                customer: true,
                referrerCustomer: true,
            }
        });
        return lead;
    }

    /**
     * Update lead information using partial data.
     */
    static async updateLead(id: string, data: Partial<typeof leads.$inferInsert>, tenantId: string) {
        // Ensure the lead exists and belongs to the tenant
        const existingLead = await db.query.leads.findFirst({
            where: and(eq(leads.id, id), eq(leads.tenantId, tenantId)),
            columns: { id: true }
        });

        if (!existingLead) {
            throw new Error('Lead not found or access denied');
        }

        const [updated] = await db.update(leads)
            .set(data)
            .where(eq(leads.id, id))
            .returning();

        return updated;
    }

    /**
     * Assign lead to a sales user.
     */
    static async assignLead(id: string, salesId: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const lead = await tx.query.leads.findFirst({
                where: and(eq(leads.id, id), eq(leads.tenantId, tenantId))
            });
            if (!lead) throw new Error('Lead not found or access denied');

            const [updated] = await tx.update(leads)
                .set({
                    assignedSalesId: salesId,
                    assignedAt: new Date(),
                    status: lead.status === 'PENDING_ASSIGNMENT' ? 'PENDING_FOLLOWUP' : lead.status,
                })
                .where(eq(leads.id, id))
                .returning();

            await tx.insert(leadStatusHistory).values({
                tenantId: lead.tenantId,
                leadId: id,
                oldStatus: lead.status || 'PENDING_ASSIGNMENT',
                newStatus: updated.status || 'PENDING_ASSIGNMENT',
                changedBy: userId,
                reason: 'Manual Assignment',
            });

            return updated;
        });
    }

    /**
     * Add a followup activity to a lead.
     */
    static async addActivity(
        leadId: string,
        data: {
            type: string;
            content: string;
            nextFollowupAt?: Date;
            quoteId?: string;
            purchaseIntention?: "HIGH" | "MEDIUM" | "LOW";
            customerLevel?: string;
        },
        tenantId: string,
        userId: string
    ) {
        await db.transaction(async (tx) => {
            const lead = await tx.query.leads.findFirst({
                where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId))
            });
            if (!lead) throw new Error('Lead not found or access denied');

            const activityType: "PHONE_CALL" | "WECHAT_CHAT" | "STORE_VISIT" | "HOME_VISIT" | "QUOTE_SENT" | "SYSTEM" =
                data.type === 'OTHER' ? 'SYSTEM' : (data.type as "PHONE_CALL" | "WECHAT_CHAT" | "STORE_VISIT" | "HOME_VISIT" | "QUOTE_SENT");

            await tx.insert(leadActivities).values({
                tenantId,
                leadId,
                activityType,
                content: data.content,
                nextFollowupDate: data.nextFollowupAt,
                createdBy: userId,
                quoteId: data.quoteId || null,
                purchaseIntention: data.purchaseIntention || null,
                customerLevel: data.customerLevel || null,
            });

            let newStatus = lead.status;
            if (lead.status === 'PENDING_FOLLOWUP' || lead.status === 'PENDING_ASSIGNMENT') {
                newStatus = 'FOLLOWING_UP';
            }

            // Update Lead status and intention
            await tx.update(leads)
                .set({
                    status: newStatus,
                    lastActivityAt: new Date(),
                    nextFollowupAt: data.nextFollowupAt,
                    intentionLevel: data.purchaseIntention || lead.intentionLevel,
                })
                .where(eq(leads.id, leadId));

            if (newStatus !== lead.status) {
                await tx.insert(leadStatusHistory).values({
                    tenantId: lead.tenantId,
                    leadId: leadId,
                    oldStatus: lead.status || 'PENDING_ASSIGNMENT',
                    newStatus: newStatus || 'PENDING_ASSIGNMENT',
                    changedBy: userId,
                    reason: 'Follow-up Added',
                });
            }
        });
    }

    /**
     * Void a lead (Mark as lost/void).
     */
    static async voidLead(id: string, reason: string, tenantId: string, userId: string) {
        await db.transaction(async (tx) => {
            const lead = await tx.query.leads.findFirst({
                where: and(eq(leads.id, id), eq(leads.tenantId, tenantId))
            });
            if (!lead) throw new Error('Lead not found or access denied');

            await tx.update(leads)
                .set({
                    status: 'VOID',
                    lostReason: reason,
                })
                .where(eq(leads.id, id));

            await tx.insert(leadStatusHistory).values({
                tenantId: lead.tenantId,
                leadId: id,
                oldStatus: lead.status || 'PENDING_ASSIGNMENT',
                newStatus: 'VOID',
                changedBy: userId,
                reason,
            });
        });
    }

    /**
     * Convert a lead to a confirmed customer (Status: WON).
     */
    static async convertLead(
        leadId: string,
        targetCustomerId: string | undefined,
        tenantId: string,
        userId: string
    ) {
        return await db.transaction(async (tx) => {
            let finalCustomerId = targetCustomerId;

            const lead = await tx.query.leads.findFirst({
                where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId))
            });
            if (!lead) throw new Error('Lead not found or access denied');

            // If no customer ID provided, create new customer from lead info
            if (!finalCustomerId) {
                const customerNo = `C${format(new Date(), 'yyyyMMdd')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

                const [newCustomer] = await tx.insert(customers).values({
                    tenantId,
                    customerNo,
                    name: lead.customerName,
                    phone: lead.customerPhone,
                    createdBy: userId,
                    assignedSalesId: lead.assignedSalesId || userId,
                    type: 'INDIVIDUAL',
                }).returning();
                finalCustomerId = newCustomer.id;
            }

            await tx.update(leads)
                .set({
                    status: 'WON',
                    customerId: finalCustomerId,
                    wonAt: new Date(),
                })
                .where(eq(leads.id, leadId));

            // Update Channel Amount Stats if channel exists
            if (lead.channelId) {
                const estimatedAmountNum = parseFloat(lead.estimatedAmount || '0') || 0;
                await tx.update(channels)
                    .set({
                        totalDealAmount: sql`COALESCE(${channels.totalDealAmount}, '0')::decimal + ${estimatedAmountNum}::decimal`
                    })
                    .where(and(eq(channels.id, lead.channelId), eq(channels.tenantId, tenantId)));
            }

            await tx.insert(leadStatusHistory).values({
                tenantId: lead.tenantId,
                leadId: leadId,
                oldStatus: lead.status || 'PENDING_ASSIGNMENT',
                newStatus: 'WON',
                changedBy: userId,
                reason: 'Converted to Customer',
            });

            return finalCustomerId;
        });
    }

    /**
     * Get lead timeline activities.
     */
    static async getLeadTimeline(leadId: string, tenantId: string) {
        // Ensure lead belongs to tenant
        const lead = await db.query.leads.findFirst({
            where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)),
            columns: { id: true }
        });

        if (!lead) {
            throw new Error('Lead not found or access denied');
        }

        const activities = await db.query.leadActivities.findMany({
            where: eq(leadActivities.leadId, leadId),
            with: {
                creator: true,
            },
            orderBy: [desc(leadActivities.createdAt)],
        });

        return activities;
    }

    /**
     * Release a lead back to the public pool.
     */
    static async releaseToPool(leadId: string, tenantId: string, userId: string) {
        await db.transaction(async (tx) => {
            const lead = await tx.query.leads.findFirst({
                where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId))
            });
            if (!lead) throw new Error('Lead not found or access denied');

            await tx.update(leads)
                .set({
                    assignedSalesId: null,
                    status: 'PENDING_ASSIGNMENT',
                })
                .where(eq(leads.id, leadId));

            await tx.insert(leadStatusHistory).values({
                tenantId: lead.tenantId,
                leadId: leadId,
                oldStatus: lead.status || 'PENDING_ASSIGNMENT',
                newStatus: 'PENDING_ASSIGNMENT',
                changedBy: userId,
                reason: 'Released to Pool',
            });
        });
    }

    /**
     * Claim a lead from the public pool.
     */
    static async claimFromPool(leadId: string, tenantId: string, userId: string) {
        await db.transaction(async (tx) => {
            // FOR UPDATE lock to prevent race conditions
            const [lead] = await tx.select().from(leads)
                .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)))
                .for('update');

            if (!lead) throw new Error('Lead not found or access denied');

            if (lead.assignedSalesId) {
                throw new Error('Lead already assigned');
            }

            await tx.update(leads)
                .set({
                    assignedSalesId: userId,
                    assignedAt: new Date(),
                    status: 'PENDING_FOLLOWUP',
                })
                .where(eq(leads.id, leadId));

            await tx.insert(leadStatusHistory).values({
                tenantId: lead.tenantId,
                leadId: leadId,
                oldStatus: lead.status || 'PENDING_ASSIGNMENT',
                newStatus: 'PENDING_FOLLOWUP',
                changedBy: userId,
                reason: 'Claimed from Pool',
            });
        });
    }
}
