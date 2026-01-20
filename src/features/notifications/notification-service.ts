'use server';

import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import {
    notifications,
    notificationTemplates,
    notificationQueue,
    systemAnnouncements
} from '@/shared/api/schema/notifications';
import { eq, and, sql, gte, lte, isNull, or, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * 通知服务
 * 
 * 功能：
 * 1. 基于模板发送通知
 * 2. 变量渲染
 * 3. 队列管理
 * 4. 重试策略
 */

// ==================== 模板渲染 ====================

/**
 * 渲染模板内容（替换变量）
 */
export function renderTemplate(
    template: string,
    params: Record<string, string | number | undefined>
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? String(params[key]) : match;
    });
}

// ==================== 发送通知 ====================

interface SendNotificationParams {
    templateCode: string;
    userId: string;
    params: Record<string, string | number | undefined>;
    channels?: ('IN_APP' | 'SMS' | 'EMAIL' | 'WECHAT')[];
    scheduledAt?: Date;
}

/**
 * 基于模板发送通知
 */
export async function sendNotificationByTemplate(input: SendNotificationParams) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    const tenantId = session.user.tenantId;

    // 1. 获取模板
    const template = await db.query.notificationTemplates.findFirst({
        where: and(
            eq(notificationTemplates.code, input.templateCode),
            or(
                eq(notificationTemplates.tenantId, tenantId),
                isNull(notificationTemplates.tenantId) // 系统模板
            ),
            eq(notificationTemplates.isActive, true)
        ),
    });

    if (!template) {
        return { success: false, error: `模板不存在: ${input.templateCode}` };
    }

    // 2. 渲染内容
    const title = renderTemplate(template.titleTemplate, input.params);
    const content = renderTemplate(template.contentTemplate, input.params);

    // 3. 获取发送渠道
    const channels = input.channels || (template.channels as string[]) || ['IN_APP'];

    // 4. 为每个渠道创建队列记录
    const queueItems = [];

    for (const channel of channels) {
        const [item] = await db.insert(notificationQueue).values({
            tenantId,
            templateId: template.id,
            templateCode: input.templateCode,
            userId: input.userId,
            channel,
            title,
            content,
            status: 'PENDING',
            priority: template.priority || 'NORMAL',
            scheduledAt: input.scheduledAt,
        }).returning();

        queueItems.push(item);

        // 如果是站内信，直接创建通知记录
        if (channel === 'IN_APP') {
            await db.insert(notifications).values({
                tenantId,
                userId: input.userId,
                title,
                content,
                type: template.notificationType,
                channel: 'IN_APP',
                linkUrl: input.params.linkUrl as string,
            });

            // 更新队列状态
            await db.update(notificationQueue)
                .set({ status: 'SENT', processedAt: new Date() })
                .where(eq(notificationQueue.id, item.id));
        }
    }

    return {
        success: true,
        data: {
            queuedCount: queueItems.length,
            channels,
        }
    };
}

// ==================== 队列处理 ====================

/**
 * 处理通知队列（由 Cron Job 调用）
 */
export async function processNotificationQueue(batchSize: number = 50) {
    // 获取待处理的队列项
    const pendingItems = await db.query.notificationQueue.findMany({
        where: and(
            eq(notificationQueue.status, 'PENDING'),
            or(
                isNull(notificationQueue.scheduledAt),
                lte(notificationQueue.scheduledAt, new Date())
            )
        ),
        orderBy: [
            sql`CASE WHEN ${notificationQueue.priority} = 'URGENT' THEN 1 
                     WHEN ${notificationQueue.priority} = 'HIGH' THEN 2 
                     WHEN ${notificationQueue.priority} = 'NORMAL' THEN 3 
                     ELSE 4 END`,
            notificationQueue.createdAt
        ],
        limit: batchSize,
    });

    const results = {
        processed: 0,
        success: 0,
        failed: 0,
    };

    for (const item of pendingItems) {
        results.processed++;

        try {
            // 更新为处理中
            await db.update(notificationQueue)
                .set({ status: 'PROCESSING' })
                .where(eq(notificationQueue.id, item.id));

            // 根据渠道发送
            let sendResult = false;
            switch (item.channel) {
                case 'IN_APP':
                    // 已在创建时处理
                    sendResult = true;
                    break;
                case 'SMS':
                    sendResult = await sendSms(item.targetPhone || '', item.content);
                    break;
                case 'EMAIL':
                    sendResult = await sendEmail(item.targetEmail || '', item.title, item.content);
                    break;
                case 'WECHAT':
                    sendResult = await sendWechat(item.userId || '', item.title, item.content);
                    break;
                default:
                    sendResult = false;
            }

            if (sendResult) {
                await db.update(notificationQueue)
                    .set({ status: 'SENT', processedAt: new Date() })
                    .where(eq(notificationQueue.id, item.id));
                results.success++;
            } else {
                throw new Error('发送失败');
            }
        } catch (error) {
            const retryCount = parseInt(item.retryCount || '0') + 1;
            const maxRetries = parseInt(item.maxRetries || '3');

            await db.update(notificationQueue)
                .set({
                    status: retryCount >= maxRetries ? 'FAILED' : 'PENDING',
                    retryCount: String(retryCount),
                    lastError: error instanceof Error ? error.message : '未知错误',
                })
                .where(eq(notificationQueue.id, item.id));

            results.failed++;
        }
    }

    return results;
}

// ==================== 渠道发送函数（占位符） ====================

async function sendSms(phone: string, content: string): Promise<boolean> {
    if (!phone) return false;
    // TODO: 集成阿里云短信服务
    console.log(`[SMS] To: ${phone}, Content: ${content}`);
    return true;
}

async function sendEmail(email: string, subject: string, content: string): Promise<boolean> {
    if (!email) return false;
    // TODO: 集成邮件服务
    console.log(`[EMAIL] To: ${email}, Subject: ${subject}`);
    return true;
}

async function sendWechat(userId: string, title: string, content: string): Promise<boolean> {
    if (!userId) return false;
    // TODO: 集成微信模板消息
    console.log(`[WECHAT] UserId: ${userId}, Title: ${title}`);
    return true;
}

// ==================== 系统公告 ====================

/**
 * 获取当前有效的系统公告
 */
export async function getActiveAnnouncements(userRole?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    const tenantId = session.user.tenantId;
    const now = new Date();

    return await db.query.systemAnnouncements.findMany({
        where: and(
            or(
                eq(systemAnnouncements.tenantId, tenantId),
                isNull(systemAnnouncements.tenantId) // 全平台公告
            ),
            lte(systemAnnouncements.startAt, now),
            or(
                isNull(systemAnnouncements.endAt),
                gte(systemAnnouncements.endAt, now)
            )
        ),
        orderBy: [
            desc(systemAnnouncements.isPinned),
            desc(systemAnnouncements.createdAt)
        ],
        limit: 10,
    });
}

/**
 * 创建系统公告
 */
export async function createAnnouncement(input: {
    title: string;
    content: string;
    type?: string;
    targetRoles?: string[];
    startAt: Date;
    endAt?: Date;
    isPinned?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    const [announcement] = await db.insert(systemAnnouncements).values({
        tenantId: session.user.tenantId,
        title: input.title,
        content: input.content,
        type: input.type || 'INFO',
        targetRoles: input.targetRoles,
        startAt: input.startAt,
        endAt: input.endAt,
        isPinned: input.isPinned || false,
        createdBy: session.user.id,
    }).returning();

    revalidatePath('/');

    return { success: true, data: announcement };
}

// ==================== 模板管理 ====================

/**
 * 获取通知模板列表
 */
export async function getNotificationTemplates() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    return await db.query.notificationTemplates.findMany({
        where: or(
            eq(notificationTemplates.tenantId, session.user.tenantId),
            isNull(notificationTemplates.tenantId)
        ),
        orderBy: [notificationTemplates.notificationType, notificationTemplates.code],
    });
}

/**
 * 创建或更新通知模板
 */
export async function upsertNotificationTemplate(input: {
    id?: string;
    code: string;
    name: string;
    notificationType: string;
    titleTemplate: string;
    contentTemplate: string;
    smsTemplate?: string;
    channels?: string[];
    paramMapping?: { key: string; label: string; source: string; defaultValue?: string }[];
}) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    const tenantId = session.user.tenantId;

    if (input.id) {
        // 更新
        const [updated] = await db.update(notificationTemplates)
            .set({
                code: input.code,
                name: input.name,
                notificationType: input.notificationType,
                titleTemplate: input.titleTemplate,
                contentTemplate: input.contentTemplate,
                smsTemplate: input.smsTemplate,
                channels: input.channels || ['IN_APP'],
                paramMapping: input.paramMapping,
                updatedAt: new Date(),
            })
            .where(and(
                eq(notificationTemplates.id, input.id),
                eq(notificationTemplates.tenantId, tenantId)
            ))
            .returning();

        return { success: true, data: updated };
    } else {
        // 新建
        const [created] = await db.insert(notificationTemplates).values({
            tenantId,
            code: input.code,
            name: input.name,
            notificationType: input.notificationType,
            titleTemplate: input.titleTemplate,
            contentTemplate: input.contentTemplate,
            smsTemplate: input.smsTemplate,
            channels: input.channels || ['IN_APP'],
            paramMapping: input.paramMapping,
        }).returning();

        return { success: true, data: created };
    }
}
