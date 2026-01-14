'use server';

import { db } from '@/shared/api/db';
import { leads, leadActivities, leadStatusHistory, customers, channels } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import {
    createLeadSchema,
    updateLeadSchema,
    assignLeadSchema,
    addLeadFollowupSchema,
    voidLeadSchema,
    convertLeadSchema,
    createCustomerSchema
} from '../schemas';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { LeadService } from '@/services/lead.service';

// Helper to generate Lead No: LD + YYYYMMDD + 6 random hex chars (Keep if needed or remove if unused)
// createLead uses Service now, so this might be unused. 
// But let's check if convertLead needs it? No.
// We'll keep it commented out or remove it to avoid lints, but better just remove it.
// async function generateLeadNo(tenantId: string) { ... }

export async function createLead(input: z.infer<typeof createLeadSchema>, userId: string, tenantId: string) {
    const data = createLeadSchema.parse(input);

    try {
        const result = await LeadService.createLead({
            ...data,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerWechat: data.customerWechat ?? null,
            community: data.community ?? null,
            houseType: data.houseType ?? null,
            address: data.address ?? null,
            sourceChannelId: data.sourceChannelId ?? null,
            sourceSubId: data.sourceSubId ?? null,
            sourceDetail: data.sourceDetail ?? null,
            intentionLevel: data.intentionLevel ?? null,
            estimatedAmount: data.estimatedAmount ? String(data.estimatedAmount) : null,
            channelId: data.channelId ?? null,
            channelContactId: data.channelContactId ?? null,
            notes: data.remark ?? null,
            tags: data.tags ?? null,
        } as any, tenantId, userId);

        if (result.isDuplicate) {
            return {
                success: false,
                status: 'DUPLICATE',
                conflict: {
                    type: result.duplicateReason,
                    existingEntity: {
                        id: result.lead.id,
                        name: result.lead.customerName,
                        owner: result.lead.assignedSalesId
                    }
                }
            };
        }

        revalidatePath('/leads');
        return { success: true, data: result.lead };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateLead(input: z.infer<typeof updateLeadSchema>, userId: string) {
    const { id, ...data } = updateLeadSchema.parse(input);

    const [updated] = await db.update(leads)
        .set({
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerWechat: data.customerWechat ?? null,
            community: data.community ?? null,
            houseType: data.houseType ?? null,
            address: data.address ?? null,
            sourceChannelId: data.sourceChannelId ?? null,
            sourceSubId: data.sourceSubId ?? null,
            sourceDetail: data.sourceDetail ?? null,
            intentionLevel: data.intentionLevel ?? null,
            estimatedAmount: data.estimatedAmount ? String(data.estimatedAmount) : undefined,
            channelId: data.channelId,
            channelContactId: data.channelContactId,
            notes: data.remark ?? null,
            tags: data.tags ?? null,
            // updatedAt handled by hook
        })
        .where(eq(leads.id, id))
        .returning();

    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`);
    return updated;
}

export async function assignLead(input: z.infer<typeof assignLeadSchema>, userId: string) {
    const { id, salesId } = assignLeadSchema.parse(input);

    return await db.transaction(async (tx) => {
        const lead = await tx.query.leads.findFirst({ where: eq(leads.id, id) });
        if (!lead) throw new Error('Lead not found');

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
    }).then((res) => {
        revalidatePath('/leads');
        return res;
    });
}

export async function addFollowup(input: z.infer<typeof addLeadFollowupSchema>, userId: string, tenantId: string) {
    const { leadId, type, content, nextFollowupAt, quoteId, purchaseIntention, customerLevel } = addLeadFollowupSchema.parse(input);

    await db.transaction(async (tx) => {
        const lead = await tx.query.leads.findFirst({ where: eq(leads.id, leadId) });
        if (!lead) throw new Error('Lead not found');

        let activityType: "PHONE_CALL" | "WECHAT_CHAT" | "STORE_VISIT" | "HOME_VISIT" | "QUOTE_SENT" | "SYSTEM" = type as any;
        if (type === 'OTHER') {
            activityType = 'SYSTEM';
        }

        await tx.insert(leadActivities).values({
            tenantId,
            leadId,
            activityType,
            content,
            nextFollowupDate: nextFollowupAt,
            createdBy: userId,
            quoteId: quoteId || null,
            purchaseIntention: purchaseIntention || null,
            customerLevel: customerLevel || null,
        });

        let newStatus = lead.status;
        if (lead.status === 'PENDING_FOLLOWUP' || lead.status === 'PENDING_ASSIGNMENT') {
            newStatus = 'FOLLOWING_UP';
        }

        await tx.update(leads)
            .set({
                status: newStatus,
                lastActivityAt: new Date(),
                nextFollowupAt,
                intentionLevel: purchaseIntention || lead.intentionLevel,
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

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/leads');
}

export async function voidLead(input: z.infer<typeof voidLeadSchema>, userId: string) {
    const { id, reason } = voidLeadSchema.parse(input);

    await db.transaction(async (tx) => {
        const lead = await tx.query.leads.findFirst({ where: eq(leads.id, id) });
        if (!lead) throw new Error('Lead not found');

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

    revalidatePath('/leads');
}

export async function releaseToPool(leadId: string, userId: string) {
    await db.transaction(async (tx) => {
        const lead = await tx.query.leads.findFirst({ where: eq(leads.id, leadId) });
        if (!lead) throw new Error('Lead not found');

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

    revalidatePath('/leads');
}

export async function claimFromPool(leadId: string, userId: string) {
    await db.transaction(async (tx) => {
        const lead = await tx.query.leads.findFirst({ where: eq(leads.id, leadId) });
        if (!lead) throw new Error('Lead not found');

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

    revalidatePath('/leads');
}

export async function convertLead(input: z.infer<typeof convertLeadSchema>, userId: string, tenantId: string) {
    const { leadId, customerId } = convertLeadSchema.parse(input);

    return await db.transaction(async (tx) => {
        let targetCustomerId = customerId;

        const lead = await tx.query.leads.findFirst({ where: eq(leads.id, leadId) });
        if (!lead) throw new Error('Lead not found');

        if (!targetCustomerId) {
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
            targetCustomerId = newCustomer.id;
        }

        await tx.update(leads)
            .set({
                status: 'WON',
                customerId: targetCustomerId,
                wonAt: new Date(),
            })
            .where(eq(leads.id, leadId));

        if (lead.channelId) {
            await tx.update(channels)
                .set({
                    totalDealAmount: sql`${channels.totalDealAmount} + ${sql.raw(lead.estimatedAmount || '0')}`
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

        return targetCustomerId;
    }).then((res) => {
        revalidatePath('/leads');
        return res;
    });
}
