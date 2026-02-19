'use server';

import { z } from 'zod';
import {
    createLeadSchema,
    updateLeadSchema,
    assignLeadSchema,
    addLeadFollowupSchema,
    voidLeadSchema,
    convertLeadSchema
} from '../schemas';
import { revalidatePath, revalidateTag } from 'next/cache';
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

    const updated = await LeadService.updateLead(id, {
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
    }, session.user.tenantId);

    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`);
    revalidateTag(`leads-${session.user.tenantId}`, 'default');
    revalidateTag(`lead-${session.user.tenantId}-${id}`, 'default');
    return updated;
}

export async function assignLead(input: z.infer<typeof assignLeadSchema>) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.ASSIGN);

    const { id, salesId } = assignLeadSchema.parse(input);

    const updated = await LeadService.assignLead(id, salesId, session.user.tenantId, session.user.id);

    revalidatePath('/leads');
    revalidateTag(`leads-${session.user.tenantId}`, 'default');
    revalidateTag(`lead-${session.user.tenantId}-${id}`, 'default');
    return updated;
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
    const { leadId, ...data } = addLeadFollowupSchema.parse(input);

    await LeadService.addActivity(leadId, data, tenantId, userId);

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/leads');
    revalidateTag(`leads-${tenantId}`, 'default');
    revalidateTag(`lead-${tenantId}-${leadId}`, 'default');
}

export async function voidLead(input: z.infer<typeof voidLeadSchema>) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.DELETE);

    const { id, reason } = voidLeadSchema.parse(input);

    await LeadService.voidLead(id, reason, session.user.tenantId, session.user.id);

    revalidatePath('/leads');
    revalidateTag(`leads-${session.user.tenantId}`, 'default');
    revalidateTag(`lead-${session.user.tenantId}-${id}`, 'default');
}

export async function releaseToPool(leadId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.TRANSFER);

    await LeadService.releaseToPool(leadId, session.user.tenantId, session.user.id);

    revalidatePath('/leads');
    revalidateTag(`leads-${session.user.tenantId}`, 'default');
    revalidateTag(`lead-${session.user.tenantId}-${leadId}`, 'default');
}

export async function claimFromPool(leadId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    await LeadService.claimFromPool(leadId, session.user.tenantId, session.user.id);

    revalidatePath('/leads');
    revalidateTag(`leads-${session.user.tenantId}`, 'default');
    revalidateTag(`lead-${session.user.tenantId}-${leadId}`, 'default');
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

    const newCustomerId = await LeadService.convertLead(leadId, customerId, tenantId, userId);

    revalidatePath('/leads');
    // Also revalidate customers list as a new customer might be created
    revalidatePath('/customers');
    revalidateTag(`leads-${tenantId}`, 'default');
    revalidateTag(`lead-${tenantId}-${leadId}`, 'default');

    return newCustomerId;
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
    revalidateTag(`leads-${tenantId}`, 'default');
    return { successCount, errors };
}
