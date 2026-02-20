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

/**
 * 创建新线索
 * 
 * 接收入参并保存至数据库。创建成功后会清除相关的缓存标签并重置路径缓存。
 * 若发现重复的电话或地址（通过 isDuplicate 检测），则返回 DUPLICATE 状态。
 * 
 * @param {z.infer<typeof createLeadSchema>} input - 创建线索的数据负载
 * @returns {Promise<{success: boolean, data?: any, status?: string, conflict?: any, error?: string}>}
 * @throws {Error} 若用户未登录或缺乏租户信息则抛出 Unauthorized 错误
 */
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

        revalidateTag(`leads-${tenantId}`, 'default');
        revalidatePath('/leads');
        return { success: true, data: result.lead };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
    }
}

/**
 * 更新线索信息
 * 
 * 根据传入的 ID 和更新负载对现有线索进行完整或部分更新。
 * 更新成功之后将重置当前线索以及列表缓存。
 * 
 * @param {z.infer<typeof updateLeadSchema>} input - 更新线索的数据负载
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * @throws {Error} 若未登录或无权修改则抛出错误
 */
export async function updateLead(input: z.infer<typeof updateLeadSchema>) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    const { id, ...data } = updateLeadSchema.parse(input);

    try {
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
        return { success: true as const, data: updated };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

/**
 * 分配线索给指定销售
 * 
 * 仅限有分配权限的角色（如 Manager/Admin）调用。
 * 支持传入可选的 version 字段乐观锁控制以避免并发覆盖。
 * 
 * @param {z.infer<typeof assignLeadSchema>} input - 包含线索 ID、销售 ID 以及版本号的分配数据
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 * @throws {Error} 未登录或未授权分配时抛出
 */
export async function assignLead(input: z.infer<typeof assignLeadSchema>) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.ASSIGN);

    const { id, salesId, version } = assignLeadSchema.parse(input);

    try {
        const updated = await LeadService.assignLead(id, salesId, session.user.tenantId, session.user.id, version);

        revalidatePath('/leads');
        revalidateTag(`leads-${session.user.tenantId}`, 'default');
        revalidateTag(`lead-${session.user.tenantId}-${id}`, 'default');
        return { success: true as const, data: updated };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

/**
 * 添加线索跟进记录（Activity）
 * 
 * 保存沟通类型、日期和跟进内容。同时会使用 version 控制以处理潜在并发冲突。
 * 
 * @param {z.infer<typeof addLeadFollowupSchema>} input - 跟进数据负载
 * @returns {Promise<void>} 
 * @throws {Error} 未授权时抛出错误
 */
export async function addFollowup(input: z.infer<typeof addLeadFollowupSchema>) {
    // 安全修复：强制从 Session 获取身份信息
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const { leadId, version, ...data } = addLeadFollowupSchema.parse(input);

    await LeadService.addActivity(leadId, data, tenantId, userId, version);

    revalidatePath(`/leads/${leadId}`);
    revalidatePath('/leads');
    revalidateTag(`leads-${tenantId}`, 'default');
    revalidateTag(`lead-${tenantId}-${leadId}`, 'default');
}

/**
 * 作废当前线索
 * 
 * 将特定线索标记为无效（INVALID），并附带作废的理由。基于版本控制防冲突。
 * 
 * @param {z.infer<typeof voidLeadSchema>} input - 包含线索 ID、作废原因及防冲突 version 的负载
 * @returns {Promise<{success: boolean, error?: string}>}
 * @throws {Error} 未能获取权限时抛出
 */
export async function voidLead(input: z.infer<typeof voidLeadSchema>) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.DELETE);

    const { id, reason, version } = voidLeadSchema.parse(input);

    try {
        await LeadService.voidLead(id, reason, session.user.tenantId, session.user.id, version);

        revalidatePath('/leads');
        revalidateTag(`leads-${session.user.tenantId}`, 'default');
        revalidateTag(`lead-${session.user.tenantId}-${id}`, 'default');
        return { success: true as const };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

/**
 * 将线索释放到公海池
 * 
 * 取消当前分配的销售人员。需具备转移线索或全局管理的权限。
 * 
 * @param {string} leadId - 线索的唯一 ID 标识
 * @returns {Promise<{success: boolean, error?: string}>}
 * @throws {Error} 未登录或缺乏权限时抛出
 */
export async function releaseToPool(leadId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    // 基础操作权限
    await checkPermission(session, PERMISSIONS.LEAD.TRANSFER);
    // @ts-expect-error - 类型尚未在 next-auth 中补全权限系统
    const hasManagePerm = session.user.permissions?.includes(PERMISSIONS.LEAD.MANAGE) || false;

    try {
        await LeadService.releaseToPool(leadId, session.user.tenantId, session.user.id, hasManagePerm);

        revalidatePath('/leads');
        revalidateTag(`leads-${session.user.tenantId}`, 'default');
        revalidateTag(`lead-${session.user.tenantId}-${leadId}`, 'default');
        return { success: true as const };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

/**
 * 从公海池认领线索
 * 
 * 将销售分配给当前请求发送者本身。
 * 
 * @param {string} leadId - 线索 ID
 * @returns {Promise<{success: boolean, error?: string}>}
 * @throws {Error} 未登录或没有对应权限时抛出
 */
export async function claimFromPool(leadId: string) {
    // 认证和权限检查
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.EDIT);

    try {
        await LeadService.claimFromPool(leadId, session.user.tenantId, session.user.id);

        revalidatePath('/leads');
        revalidateTag(`leads-${session.user.tenantId}`, 'default');
        revalidateTag(`lead-${session.user.tenantId}-${leadId}`, 'default');
        return { success: true as const };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false as const, error: message };
    }
}

/**
 * 线索转化为正式客户
 * 
 * 只有具备管理权限的人才可以调用。转化成功后会建立正式的客户关联记录。
 * 这个操作也会触发客户列表的重新验证缓存。
 * 
 * @param {z.infer<typeof convertLeadSchema>} input - 转化所需的线索与客户信息负载
 * @returns {Promise<string>} 返回新关联创建或已存在的客户 ID
 * @throws {Error}
 */
export async function convertLead(input: z.infer<typeof convertLeadSchema>) {
    // 安全修复：强制从 Session 获取身份信息
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    await checkPermission(session, PERMISSIONS.LEAD.MANAGE);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const { leadId, customerId, version } = convertLeadSchema.parse(input);

    const newCustomerId = await LeadService.convertLead(leadId, customerId, tenantId, userId, version);

    revalidatePath('/leads');
    // Also revalidate customers list as a new customer might be created
    revalidatePath('/customers');
    revalidateTag(`leads-${tenantId}`, 'default');
    revalidateTag(`lead-${tenantId}-${leadId}`, 'default');

    return newCustomerId;
}

/**
 * 批量导入线索
 * 
 * 从 Excel/CSV 解析出的未知数组执行批量录入操作。对检测到存在冲突（手机号、地址重复）的记录将被过滤并纳入错误日志收集。
 * 
 * @param {unknown[]} data - 含有未知类型的导入数据集
 * @returns {Promise<{successCount: number, errors: {row: number, error: string}[]}>}
 * @throws {Error} 权限验证抛错
 */
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
