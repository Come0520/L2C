'use server';

import { db } from '@/shared/api/db';
import { leads, channels } from '@/shared/api/schema';
import { eq, and, like, ilike } from 'drizzle-orm';
import { LeadService } from '@/services/lead.service';

/**
 * Webhook 请求体结构
 */
export interface WebhookLeadPayload {
    external_id?: string;        // 外部系统线索ID (用于幂等性)
    customer_name: string;       // 客户姓名 (必填)
    customer_phone: string;      // 客户电话 (必填)
    source_category?: string;    // 渠道大类 (支持模糊匹配)
    source_sub?: string;         // 子渠道 (支持模糊匹配)
    source_detail?: string;      // 具体来源
    community?: string;          // 楼盘
    house_type?: string;         // 户型
    intention_level?: 'HIGH' | 'MEDIUM' | 'LOW';
    estimated_amount?: number;
    remark?: string;
    force_create?: boolean;      // 强制创建 (忽略重复检查)
}

/**
 * Webhook 响应结构
 */
export interface WebhookResponse {
    code: number;
    message: string;
    data?: {
        lead_id: string;
        lead_no: string;
        status: string;
        is_new?: boolean;
    };
}

/**
 * 验证 Access-Token
 * @param token 请求头中的 Access-Token
 * @param tenantId 租户ID
 */
export async function verifyAccessToken(token: string | null, tenantId: string): Promise<boolean> {
    if (!token) return false;

    // 从租户配置中获取有效的 Access-Token
    const tenant = await db.query.tenants.findFirst({
        where: eq((await import('@/shared/api/schema')).tenants.id, tenantId),
        columns: { settings: true }
    });

    const settings = tenant?.settings as { webhookAccessToken?: string } | null;
    return settings?.webhookAccessToken === token;
}

/**
 * 渠道模糊匹配
 * @param categoryName 渠道大类名称
 * @param subName 子渠道名称
 * @param tenantId 租户ID
 */
export async function matchChannel(
    categoryName?: string,
    subName?: string,
    tenantId?: string
): Promise<{ channelId?: string; sourceDetail?: string }> {
    if (!categoryName) return {};

    // 1. 尝试精确匹配
    let channel = await db.query.channels.findFirst({
        where: and(
            eq(channels.name, categoryName),
            tenantId ? eq(channels.tenantId, tenantId) : undefined
        )
    });

    // 2. 尝试模糊匹配 (包含关系)
    if (!channel) {
        channel = await db.query.channels.findFirst({
            where: and(
                ilike(channels.name, `%${categoryName}%`),
                tenantId ? eq(channels.tenantId, tenantId) : undefined
            )
        });
    }

    return {
        channelId: channel?.id,
        sourceDetail: subName
    };
}

/**
 * 幂等性检查
 * @param externalId 外部系统线索ID
 * @param tenantId 租户ID
 */
export async function checkIdempotency(
    externalId: string,
    tenantId: string
): Promise<typeof leads.$inferSelect | null> {
    if (!externalId) return null;

    return await db.query.leads.findFirst({
        where: and(
            eq(leads.externalId, externalId),
            eq(leads.tenantId, tenantId)
        )
    }) || null;
}

/**
 * 处理 Webhook 请求
 */
export async function handleWebhookRequest(
    payload: WebhookLeadPayload,
    tenantId: string,
    systemUserId: string
): Promise<WebhookResponse> {
    // 1. 验证必填字段
    if (!payload.customer_name || !payload.customer_phone) {
        return {
            code: 400,
            message: 'Bad Request: customer_name and customer_phone are required'
        };
    }

    // 2. 幂等性检查
    if (payload.external_id) {
        const existing = await checkIdempotency(payload.external_id, tenantId);
        if (existing) {
            return {
                code: 200,
                message: 'success (idempotent)',
                data: {
                    lead_id: existing.id,
                    lead_no: existing.leadNo,
                    status: existing.status || 'PENDING_ASSIGNMENT',
                    is_new: false
                }
            };
        }
    }

    // 3. 渠道匹配
    const { channelId, sourceDetail } = await matchChannel(
        payload.source_category,
        payload.source_sub,
        tenantId
    );

    // 4. 创建线索
    try {
        const result = await LeadService.createLead({
            customerName: payload.customer_name,
            customerPhone: payload.customer_phone,
            community: payload.community || null,
            houseType: payload.house_type || null,
            channelId: channelId || null,
            sourceDetail: sourceDetail || payload.source_detail || null,
            intentionLevel: payload.intention_level || null,
            estimatedAmount: payload.estimated_amount ? String(payload.estimated_amount) : null,
            notes: payload.remark || null,
            externalId: payload.external_id || null,
        } as any, tenantId, systemUserId);

        if (result.isDuplicate && !payload.force_create) {
            return {
                code: 409,
                message: 'Conflict: 该客户已有进行中的线索',
                data: {
                    lead_id: result.lead.id,
                    lead_no: result.lead.leadNo,
                    status: result.lead.status || 'PENDING_ASSIGNMENT'
                }
            };
        }

        return {
            code: 200,
            message: 'success',
            data: {
                lead_id: result.lead.id,
                lead_no: result.lead.leadNo,
                status: result.lead.status || 'PENDING_ASSIGNMENT',
                is_new: true
            }
        };
    } catch (error: any) {
        return {
            code: 500,
            message: `Internal Error: ${error.message}`
        };
    }
}
