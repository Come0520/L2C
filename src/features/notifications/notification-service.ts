'use server';

import { db } from '@/shared/api/db';
import { SmsAdapter } from './adapters/sms-adapter';
import { LarkAdapter } from './adapters/lark-adapter';
import { WeChatAdapter } from './adapters/wechat-adapter';
import { auth } from '@/shared/lib/auth';
import {
    notifications,
    notificationTemplates,
    notificationQueue,
    systemAnnouncements
} from '@/shared/api/schema/notifications';
import { eq, and, sql, gte, lte, isNull, or, desc, inArray } from 'drizzle-orm';
import { getCachedAnnouncements, getCachedTemplates } from './notification-cache';
import { getSetting } from "@/features/settings/actions/system-settings-actions";
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';
import { RolePermissionService } from '@/shared/lib/role-permission-service';
import { PERMISSIONS } from '@/shared/config/permissions';
import { logger } from '@/shared/lib/logger';

// P1 优化：复用适配器单例，避免事务内重复实例化
const smsAdapter = new SmsAdapter();
const wechatAdapter = new WeChatAdapter();
const larkAdapter = new LarkAdapter();

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
 * HTML 转义函数，防止模板注入攻击
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 渲染模板内容（替换变量并进行 HTML 转义）
 */
export function renderTemplate(
    template: string,
    params: Record<string, string | number | undefined>
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const val = params[key];
        if (val === undefined) return match;
        // P0 修复：对替换值进行转义，防止 XSS 攻击
        return escapeHtml(String(val));
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
 * 
 * @param input - 发送参数，包含模板代码、目标用户 ID、模板变量等
 * @returns 发送结果通知，包含加入队列的数量和生效的通道
 * 
 * [渠道优先级说明]:
 * 1. 优先使用调用方指定的 `channels` 参数
 * 2. 其次读取模板配置 `template.channels`
 * 3. 兜底查询系统设置 `NOTIFICATION_CHANNELS`
 * 4. 最终回退到 `['IN_APP']` (站内信)
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
    let channels = input.channels || (template.channels as string[]);
    if (!channels || channels.length === 0) {
        const defaultChannels = await getSetting('NOTIFICATION_CHANNELS') as string[];
        channels = defaultChannels || ['IN_APP'];
    }

    // 4. 为每个渠道创建队列记录 (事务处理)
    const queueItems = await db.transaction(async (tx) => {
        const items = [];
        const today = new Date().toISOString().split('T')[0];

        for (const channel of channels) {
            const isInApp = channel === 'IN_APP';

            // 生成幂等 Token (模板+用户+渠道+日期)，防止同一天重复触发相同的 SLA 或通知
            // 注意：如果业务需要更细粒度的控制，可以在 params 中传入自定义 dedupeKey
            const idempotencyToken = `IDEMP_${input.templateCode}_${input.userId}_${channel}_${today}`;

            // L5 增强：防重检查 (去重逻辑)
            const existingItem = await tx.query.notificationQueue.findFirst({
                where: and(
                    eq(notificationQueue.tenantId, tenantId),
                    eq(notificationQueue.idempotencyToken, idempotencyToken)
                )
            });

            if (existingItem) {
                logger.info(`[Notification] Skip duplicate notification: ${idempotencyToken}`);
                continue;
            }

            // 插入队列
            // 如果是 IN_APP，直接标记为 SENT，因为接下来会立即写入 notifications 表
            const [item] = await tx.insert(notificationQueue).values({
                tenantId,
                templateId: template.id,
                templateCode: input.templateCode,
                userId: input.userId,
                channel,
                title,
                content,
                status: isInApp ? 'SENT' : 'PENDING',
                priority: template.priority || 'NORMAL',
                scheduledAt: input.scheduledAt,
                idempotencyToken: idempotencyToken,
                // IN_APP 被视为立即处理
                processedAt: isInApp ? new Date() : null,
            }).returning();

            items.push(item);

            // 如果是站内信，直接创建通知记录
            if (isInApp) {
                await tx.insert(notifications).values({
                    tenantId,
                    userId: input.userId,
                    title,
                    content,
                    type: template.notificationType,
                    channel: 'IN_APP',
                    linkUrl: input.params.linkUrl ? String(input.params.linkUrl) : undefined,
                });
            }
        }
        return items;
    });

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
 * 处理通知队列（由 Cron Job 定时任务调用）
 * 
 * @param batchSize - 单次处理的批量大小，默认 50
 * @returns 处理统计结果（成功、失败、处理总数）
 * 
 * [回退策略 (Fallback Strategy)]:
 * - 消息状态流转: PENDING -> PROCESSING -> SENT (成功) 或 PENDING (失败回退)
 * - 失败重试: 单次发送失败后，状态回退为 PENDING 并递增 `retryCount`
 * - 断头台机制: 超过 3 次重试后标记为 FAILED 并记录 `lastError`
 * - 并发保护: 使用 `skipLocked: true` 确保多实例并行时不会重复处理同一条记录
 */
export async function processNotificationQueue(batchSize: number = 50) {
    // P1 优化：将事务拆分，避免外部 API I/O 导致队列表行锁过久

    // Step 1: 批量获取待处理任务并标记为 PROCESSING
    const itemsToProcess = await db.transaction(async (tx) => {
        const items = await tx.select()
            .from(notificationQueue)
            .where(and(
                eq(notificationQueue.status, 'PENDING'),
                or(
                    isNull(notificationQueue.scheduledAt),
                    lte(notificationQueue.scheduledAt, new Date())
                )
            ))
            .orderBy(
                sql`CASE WHEN ${notificationQueue.priority} = 'URGENT' THEN 1 
                         WHEN ${notificationQueue.priority} = 'HIGH' THEN 2 
                         WHEN ${notificationQueue.priority} = 'NORMAL' THEN 3 
                         ELSE 4 END`,
                notificationQueue.createdAt
            )
            .limit(batchSize)
            .for('update', { skipLocked: true });

        if (items.length === 0) return [];

        const ids = items.map(i => i.id);
        await tx.update(notificationQueue)
            .set({ status: 'PROCESSING' })
            .where(inArray(notificationQueue.id, ids));

        return items;
    });

    if (itemsToProcess.length === 0) return { processed: 0, success: 0, failed: 0 };

    const stats = {
        processed: itemsToProcess.length,
        success: 0,
        failed: 0,
    };
    const maxRetries = 3;

    // Step 2: 逐条串行处理（事务外，避免持锁）
    for (const item of itemsToProcess) {
        try {
            let sendResult = false;

            // 这里我们调用一个专门用于重试和发送的内部逻辑
            // 为了简化集成，我们手动处理 switch 逻辑
            switch (item.channel) {
                case 'IN_APP':
                    sendResult = true; // 已在创建时处理
                    break;
                case 'SMS':
                    sendResult = await smsAdapter.send({
                        userId: item.userId as string,
                        tenantId: item.tenantId,
                        title: item.title,
                        content: item.content,
                        type: item.priority === 'HIGH' ? 'WARNING' : 'INFO'
                    });
                    break;
                case 'WECHAT':
                    sendResult = await wechatAdapter.send({
                        userId: item.userId as string,
                        tenantId: item.tenantId,
                        title: item.title,
                        content: item.content,
                        type: item.priority === 'HIGH' ? 'WARNING' : 'INFO'
                    });
                    break;
                case 'LARK':
                    sendResult = await larkAdapter.send({
                        userId: item.userId as string,
                        tenantId: item.tenantId,
                        title: item.title,
                        content: item.content,
                        type: item.priority === 'HIGH' ? 'WARNING' : 'INFO'
                    });
                    break;
                default:
                    logger.warn(`[Queue] Unsupported channel ${item.channel} for item ${item.id}`);
                    sendResult = false;
            }

            // Step 3: 更新最终状态（事务外，单条记录更新）
            if (sendResult) {
                await db.update(notificationQueue)
                    .set({ status: 'SENT', processedAt: new Date() })
                    .where(eq(notificationQueue.id, item.id));
                stats.success++;
            } else {
                throw new Error('发送失败');
            }
        } catch (error) {
            const retryCount = (item.retryCount || 0) + 1;
            await db.update(notificationQueue)
                .set({
                    status: retryCount >= maxRetries ? 'FAILED' : 'PENDING',
                    retryCount: retryCount,
                    lastError: error instanceof Error ? error.message : '未知错误',
                })
                .where(eq(notificationQueue.id, item.id));

            stats.failed++;
            logger.error(`[NotificationQueue] Error processing item ${item.id}:`, error);
        }
    }

    return stats;
}


// ==================== 系统公告 ====================

/**
 * 公告创建输入校验 Schema
 */
const createAnnouncementSchema = z.object({
    title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
    content: z.string().min(1, '内容不能为空').max(10000, '内容不能超过10000字符'),
    type: z.string().max(50, '类型不能超过50字符').optional(),
    targetRoles: z.array(z.string()).optional(),
    startAt: z.date(),
    endAt: z.date().optional(),
    isPinned: z.boolean().optional(),
});

/**
 * 获取当前有效的系统公告
 */
export async function getActiveAnnouncements(userRole?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    return await getCachedAnnouncements(session.user.tenantId, userRole);
}

/**
 * 创建系统公告
 */
export async function createAnnouncement(input: z.infer<typeof createAnnouncementSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    const { role, id: userId } = session.user;

    // P1 优化: 权限校验统一化
    const hasPermission = await RolePermissionService.hasPermission(userId, PERMISSIONS.NOTIFICATION.MANAGE);
    if (!hasPermission && role !== 'ADMIN' && role !== 'MANAGER') {
        return { success: false, error: '权限不足' };
    }

    // 输入校验
    const validated = createAnnouncementSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;

    const [announcement] = await db.insert(systemAnnouncements).values({
        tenantId: session.user.tenantId,
        title: data.title,
        content: data.content,
        type: data.type || 'INFO',
        targetRoles: data.targetRoles,
        startAt: data.startAt,
        endAt: data.endAt,
        isPinned: data.isPinned || false,
        createdBy: session.user.id,
    }).returning();

    // P2: 添加审计日志
    await AuditService.log(db, {
        tableName: 'system_announcements',
        recordId: announcement.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: announcement,
    });

    // P4 优化：失效相关缓存
    revalidateTag('announcements', 'default');
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

    return await getCachedTemplates(session.user.tenantId);
}

// upsertTemplateSchema: 更新或插入通知模板的参数定义
const upsertTemplateSchema = z.object({
    id: z.string().uuid().optional(),
    code: z.string().min(1),
    name: z.string().min(1),
    titleTemplate: z.string().min(1),
    contentTemplate: z.string().min(1),
    type: z.string().optional(),
    channels: z.array(z.string()).optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    isActive: z.boolean().optional(),
    notificationType: z.string().default('SYSTEM'),
    smsTemplate: z.string().optional(),
    paramMapping: z.array(z.object({
        key: z.string(),
        label: z.string(),
        source: z.string(),
        defaultValue: z.string().optional(),
    })).optional(),
});

/**
 * 创建或更新通知模板
 */
export async function upsertNotificationTemplate(input: z.infer<typeof upsertTemplateSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 输入校验
    const validated = upsertTemplateSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }
    const data = validated.data;
    const tenantId = session.user.tenantId;

    // P1 修复: 增加权限校验，防止普通用户操作模板
    const hasPermission = await RolePermissionService.hasPermission(session.user.id, PERMISSIONS.NOTIFICATION.MANAGE);
    if (!hasPermission && session.user.role !== 'ADMIN') {
        return { success: false, error: '权限不足' };
    }

    let result;
    if (data.id) {
        // 更新
        const [updated] = await db.update(notificationTemplates)
            .set({
                code: data.code,
                name: data.name,
                notificationType: data.notificationType ?? 'SYSTEM',
                titleTemplate: data.titleTemplate,
                contentTemplate: data.contentTemplate,
                smsTemplate: data.smsTemplate,
                channels: data.channels,
                paramMapping: data.paramMapping,
                updatedAt: new Date(),
            })
            .where(and(
                eq(notificationTemplates.id, data.id),
                eq(notificationTemplates.tenantId, tenantId)
            ))
            .returning();
        result = updated;
    } else {
        // 新建
        const [created] = await db.insert(notificationTemplates).values({
            tenantId,
            code: data.code,
            name: data.name,
            notificationType: data.notificationType ?? 'SYSTEM',
            titleTemplate: data.titleTemplate,
            contentTemplate: data.contentTemplate,
            smsTemplate: data.smsTemplate,
            channels: data.channels,
            paramMapping: data.paramMapping,
        }).returning();
        result = created;
    }

    if (!result) {
        return { success: false, error: '操作失败' };
    }

    // P2: 添加审计日志
    await AuditService.log(db, {
        tableName: 'notification_templates',
        recordId: result.id,
        action: data.id ? 'UPDATE' : 'CREATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: result,
    });

    // P4 优化：失效相关缓存
    revalidateTag('notification-templates', 'default');

    return { success: true, data: result };
}
