'use server';

import { db } from '@/shared/api/db';
import { leads, leadActivities, leadStatusHistory, customers, channels } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
    createLeadSchema,
    updateLeadSchema,
    assignLeadSchema,
    addLeadFollowupSchema,
    voidLeadSchema,
    convertLeadSchema
} from '../schemas';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { LeadService } from '@/services/lead.service';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

export async function createLead(input: z.infer<typeof createLeadSchema>) {
    // 安全修复：强制从 Session 获取身份信息，不再信任前端参数
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.CREATE);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const data = createLeadSchema.parse(input);

    try {
        // 构造 LeadService 输入：转换字段名和处理可选值
        const result = await LeadService.createLead({
            ...data,
            estimatedAmount: data.estimatedAmount ? String(data.estimatedAmount) : null,
            notes: data.remark ?? null,
        }, tenantId, userId);

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

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}

export async function updateLead(input: z.infer<typeof updateLeadSchema>) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    const { id, ...data } = updateLeadSchema.parse(input);

    // 租户隔离：验证线索属于当前租户
    const existingLead = await db.query.leads.findFirst({
        where: and(eq(leads.id, id), eq(leads.tenantId, session.user.tenantId)),
        columns: { id: true }
    });
    if (!existingLead) {
        throw new Error('Lead not found or access denied');
    }

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
        })
        .where(eq(leads.id, id))
        .returning();

    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`);
    return updated;
}

export async function assignLead(input: z.infer<typeof assignLeadSchema>, userId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.ASSIGN);

    const { id, salesId } = assignLeadSchema.parse(input);

    return await db.transaction(async (tx) => {
        // 租户隔离
        const lead = await tx.query.leads.findFirst({
            where: and(eq(leads.id, id), eq(leads.tenantId, session.user.tenantId))
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
    }).then((res) => {
        revalidatePath('/leads');
        return res;
    });
}

export async function addFollowup(input: z.infer<typeof addLeadFollowupSchema>) {
    // 安全修复：强制从 Session 获取身份信息
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const { leadId, type, content, nextFollowupAt, quoteId, purchaseIntention, customerLevel } = addLeadFollowupSchema.parse(input);

    await db.transaction(async (tx) => {
        // 租户隔离
        const lead = await tx.query.leads.findFirst({
            where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId))
        });
        if (!lead) throw new Error('Lead not found or access denied');

        let activityType: "PHONE_CALL" | "WECHAT_CHAT" | "STORE_VISIT" | "HOME_VISIT" | "QUOTE_SENT" | "SYSTEM" = type === 'OTHER' ? 'SYSTEM' : (type as "PHONE_CALL" | "WECHAT_CHAT" | "STORE_VISIT" | "HOME_VISIT" | "QUOTE_SENT");
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
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.DELETE);

    const { id, reason } = voidLeadSchema.parse(input);

    await db.transaction(async (tx) => {
        // 租户隔离
        const lead = await tx.query.leads.findFirst({
            where: and(eq(leads.id, id), eq(leads.tenantId, session.user.tenantId))
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

    revalidatePath('/leads');
}

export async function releaseToPool(leadId: string, userId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.TRANSFER);

    await db.transaction(async (tx) => {
        // 租户隔离
        const lead = await tx.query.leads.findFirst({
            where: and(eq(leads.id, leadId), eq(leads.tenantId, session.user.tenantId))
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

    revalidatePath('/leads');
}

export async function claimFromPool(leadId: string, userId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    await db.transaction(async (tx) => {
        // 租户隔离 + FOR UPDATE 锁防止竞态条件
        const [lead] = await tx.select().from(leads)
            .where(and(eq(leads.id, leadId), eq(leads.tenantId, session.user.tenantId)))
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

    revalidatePath('/leads');
}

export async function convertLead(input: z.infer<typeof convertLeadSchema>) {
    // 安全修复：强制从 Session 获取身份信息
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.MANAGE);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const { leadId, customerId } = convertLeadSchema.parse(input);

    return await db.transaction(async (tx) => {
        let targetCustomerId = customerId;

        // 租户隔离
        const lead = await tx.query.leads.findFirst({
            where: and(eq(leads.id, leadId), eq(leads.tenantId, tenantId))
        });
        if (!lead) throw new Error('Lead not found or access denied');

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
            // 安全修复：使用 COALESCE 和数值处理，避免 sql.raw() 拼接用户输入
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

        return targetCustomerId;
    }).then((res) => {
        revalidatePath('/leads');
        return res;
    });
}

export async function importLeads(data: unknown[]) {
    // 安全修复：强制从 Session 获取身份信息
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.IMPORT);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    let successCount = 0;
    const errors: { row: number, error: string }[] = [];

    // Batch processing
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        // Basic Transformation if needed
        // Assuming row keys match createLeadSchema

        const parseResult = createLeadSchema.safeParse(row);

        if (!parseResult.success) {
            errors.push({
                row: i + 1,
                error: parseResult.error.issues.map(iss => `${iss.path.join('.')}: ${iss.message}`).join('; ')
            });
            continue;
        }

        const validData = parseResult.data;

        try {
            const result = await LeadService.createLead({
                ...validData,
                customerName: validData.customerName,
                customerPhone: validData.customerPhone,
                customerWechat: validData.customerWechat ?? null,
                community: validData.community ?? null,
                houseType: validData.houseType ?? null,
                address: validData.address ?? null,
                sourceChannelId: validData.sourceChannelId ?? null,
                sourceSubId: validData.sourceSubId ?? null,
                sourceDetail: validData.sourceDetail ?? null,
                intentionLevel: validData.intentionLevel ?? null,
                estimatedAmount: validData.estimatedAmount ? String(validData.estimatedAmount) : null,
                channelId: validData.channelId ?? null,
                channelContactId: validData.channelContactId ?? null,
                notes: validData.remark ?? null,
                tags: validData.tags ?? null,
            }, tenantId, userId);

            if (result.isDuplicate) {
                errors.push({
                    row: i + 1,
                    error: `重复线索: ${result.duplicateReason === 'PHONE' ? '手机号重复' : '地址重复'} (与现有活跃线索冲突)`
                });
            } else {
                successCount++;
            }
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            errors.push({ row: i + 1, error: errMsg });
        }
    }

    revalidatePath('/leads');
    return { successCount, errors };
}
