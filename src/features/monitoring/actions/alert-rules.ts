'use server';

import { db } from '@/shared/api/db';
import { auditLogs } from '@/shared/api/schema';
import { riskAlerts } from '@/shared/api/schema/traceability';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { logger } from '@/shared/lib/logger';

// ============================================================
// Schema 定义
// ============================================================

/** 告警触发条件类型（映射到 riskAlerts.riskType） */
const alertConditionEnum = z.enum([
    'ORDER_OVERDUE',      // 订单超时未处理
    'APPROVAL_PENDING',   // 审批待处理超时
    'PAYMENT_DUE',        // 付款到期（映射 PAYMENT_OVERDUE）
    'INVENTORY_LOW',      // 库存不足
    'CUSTOM',             // 自定义条件
]);

/** 通知模板类型 */
const notificationTemplateEnum = z.enum([
    'ORDER_OVERDUE',      // 订单超时提醒模板
    'APPROVAL_PENDING',   // 审批待处理模板
    'PAYMENT_DUE',        // 付款到期模板
    'INVENTORY_LOW',      // 库存不足模板
    'CUSTOM',             // 自定义模板
]);

const createAlertRuleSchema = z.object({
    name: z.string().min(1, '告警规则名称不能为空'),
    condition: alertConditionEnum,
    thresholdDays: z.number().min(1).max(90),
    targetRoles: z.array(z.string().min(1)).min(1, '至少指定一个目标角色'),
    notificationTemplate: notificationTemplateEnum,
    isEnabled: z.boolean().default(true),
    description: z.string().optional(),
});

const deleteAlertRuleSchema = z.object({
    ruleId: z.string().min(1),
});

const updateAlertRuleSchema = z.object({
    ruleId: z.string().min(1),
    name: z.string().min(1, '告警规则名称不能为空').optional(),
    condition: alertConditionEnum.optional(),
    thresholdDays: z.number().min(1).max(90).optional(),
    targetRoles: z.array(z.string().min(1)).min(1, '至少指定一个目标角色').optional(),
    notificationTemplate: notificationTemplateEnum.optional(),
    isEnabled: z.boolean().optional(),
    description: z.string().optional(),
});

const listAlertRulesSchema = z.object({});

const sendBulkNotificationSchema = z.object({
    targetRoles: z.array(z.string().min(1)).min(1, '至少指定一个目标角色'),
    title: z.string().min(1, '标题不能为空'),
    content: z.string().min(1, '内容不能为空'),
    type: z.enum(['INFO', 'WARNING', 'ERROR']).default('INFO'),
    link: z.string().optional(),
});

// ============================================================
// 通知模板定义
// ============================================================

/** 预设通知模板映射 */
const NOTIFICATION_TEMPLATES: Record<string, { titleTemplate: string; contentTemplate: string }> = {
    ORDER_OVERDUE: {
        titleTemplate: '⚠️ 订单超时提醒',
        contentTemplate: '您有 {count} 个订单已超过 {days} 天未处理，请及时跟进。',
    },
    APPROVAL_PENDING: {
        titleTemplate: '📋 审批待处理提醒',
        contentTemplate: '您有 {count} 个审批已等待超过 {days} 天，请尽快处理。',
    },
    PAYMENT_DUE: {
        titleTemplate: '💰 付款到期提醒',
        contentTemplate: '有 {count} 笔付款将在 {days} 天内到期，请注意安排。',
    },
    INVENTORY_LOW: {
        titleTemplate: '📦 库存不足预警',
        contentTemplate: '{count} 种商品库存低于安全线，请及时补货。',
    },
    CUSTOM: {
        titleTemplate: '🔔 自定义告警',
        contentTemplate: '触发了自定义告警条件，请关注。',
    },
};

/**
 * 根据模板名称获取通知内容
 * @param templateName - 模板名称
 * @param params - 模板参数
 * @returns 渲染后的标题和内容
 */
export function renderTemplate(
    templateName: string,
    params: Record<string, string | number> = {}
): { title: string; content: string } {
    const template = NOTIFICATION_TEMPLATES[templateName] || NOTIFICATION_TEMPLATES.CUSTOM;

    let title = template.titleTemplate;
    let content = template.contentTemplate;

    // 替换模板变量
    for (const [key, value] of Object.entries(params)) {
        const placeholder = `{${key}}`;
        title = title.replaceAll(placeholder, String(value));
        content = content.replaceAll(placeholder, String(value));
    }

    return { title, content };
}

// ============================================================
// Actions
// ============================================================

/**
 * 创建告警规则
 * 复用 riskAlerts 表存储告警配置，riskType 存储告警条件，metadata 存储规则配置
 * 需要 NOTIFICATION.MANAGE 权限
 */
const createAlertRuleInternal = createSafeAction(createAlertRuleSchema, async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    try {
        await db.insert(riskAlerts).values({
            tenantId: session.user.tenantId!,
            riskType: data.condition,
            riskLevel: 'MEDIUM',
            title: data.name,
            description: data.description ?? null,
            suggestedAction: `模板: ${data.notificationTemplate}, 阈值: ${data.thresholdDays}天`,
            status: data.isEnabled ? 'OPEN' : 'IGNORED',
            affectedOrders: [],
            affectedCount: String(data.thresholdDays),
        });

        // 审计日志
        await db.insert(auditLogs).values({
            tenantId: session.user.tenantId,
            action: 'CREATE_ALERT_RULE',
            tableName: 'risk_alerts',
            recordId: 'new',
            userId: session.user.id,
            newValues: data as Record<string, unknown>,
            createdAt: new Date(),
        });

        logger.info(`告警规则已创建: name=${data.name}, condition=${data.condition}`);
        return { success: true };
    } catch (error) {
        logger.error('创建告警规则失败:', error);
        return { success: false, error: '创建告警规则失败' };
    }
});

export async function createAlertRule(data: z.input<typeof createAlertRuleSchema>) {
    return createAlertRuleInternal(data as z.infer<typeof createAlertRuleSchema>);
}

/**
 * 查询当前租户的告警规则列表
 */
const listAlertRulesInternal = createSafeAction(listAlertRulesSchema, async (_data, { session }) => {
    const rules = await db.select().from(riskAlerts).where(
        eq(riskAlerts.tenantId, session.user.tenantId!)
    );
    return { success: true, data: rules };
});

export async function listAlertRules() {
    return listAlertRulesInternal({});
}

/**
 * 删除告警规则
 * 需要 NOTIFICATION.MANAGE 权限
 */
const deleteAlertRuleInternal = createSafeAction(deleteAlertRuleSchema, async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    try {
        // 确保只能删除自己租户的规则
        await db.delete(riskAlerts).where(
            and(
                eq(riskAlerts.id, data.ruleId),
                eq(riskAlerts.tenantId, session.user.tenantId!)
            ),
        );

        // 审计日志
        await db.insert(auditLogs).values({
            tenantId: session.user.tenantId,
            action: 'DELETE_ALERT_RULE',
            tableName: 'risk_alerts',
            recordId: data.ruleId,
            userId: session.user.id,
            newValues: { deletedRuleId: data.ruleId },
            createdAt: new Date(),
        });

        logger.info(`告警规则已删除: ruleId=${data.ruleId}`);
        return { success: true };
    } catch (error) {
        logger.error('删除告警规则失败:', error);
        return { success: false, error: '删除告警规则失败' };
    }
});

export async function deleteAlertRule(data: z.infer<typeof deleteAlertRuleSchema>) {
    return deleteAlertRuleInternal(data);
}

/**
 * 更新告警规则
 * 需要 NOTIFICATION.MANAGE 权限
 */
const updateAlertRuleInternal = createSafeAction(updateAlertRuleSchema, async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    try {
        const { ruleId, ...updateData } = data;

        const dbUpdate: Partial<typeof riskAlerts.$inferInsert> = { updatedAt: new Date() };
        if (updateData.name !== undefined) dbUpdate.title = updateData.name;
        if (updateData.condition !== undefined) dbUpdate.riskType = updateData.condition;
        if (updateData.description !== undefined) dbUpdate.description = updateData.description;
        if (updateData.isEnabled !== undefined) dbUpdate.status = updateData.isEnabled ? 'OPEN' : 'IGNORED';
        if (updateData.thresholdDays !== undefined) dbUpdate.affectedCount = String(updateData.thresholdDays);

        // 仅当两个相关参数都提供时简单更新建议，不然维持原状
        if (updateData.notificationTemplate && updateData.thresholdDays) {
            dbUpdate.suggestedAction = `模板: ${updateData.notificationTemplate}, 阈值: ${updateData.thresholdDays}天`;
        }

        const result = await db.update(riskAlerts).set(dbUpdate).where(
            and(
                eq(riskAlerts.id, ruleId),
                eq(riskAlerts.tenantId, session.user.tenantId!)
            )
        ).returning({ id: riskAlerts.id });

        if (!result.length) {
            return { success: false, error: '未找到该告警规则或无权操作' };
        }

        // 审计日志
        await db.insert(auditLogs).values({
            tenantId: session.user.tenantId,
            action: 'UPDATE_ALERT_RULE',
            tableName: 'risk_alerts',
            recordId: ruleId,
            userId: session.user.id,
            newValues: updateData as Record<string, unknown>,
            createdAt: new Date(),
        });

        logger.info(`告警规则已更新: ruleId=${ruleId}`);
        return { success: true };
    } catch (error) {
        logger.error('更新告警规则失败:', error);
        return { success: false, error: '更新告警规则失败' };
    }
});

export async function updateAlertRule(data: z.infer<typeof updateAlertRuleSchema>) {
    return updateAlertRuleInternal(data);
}

/**
 * 向指定角色组批量发送通知
 * 需要 NOTIFICATION.MANAGE 权限
 *
 * @remarks 当前实现为骨架版本，实际应从 DB 查询角色对应用户列表后逐一发送
 */
const sendBulkNotificationInternal = createSafeAction(sendBulkNotificationSchema, async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    try {
        // TODO: 实际实现应查询 targetRoles 对应的用户列表
        // const targetUsers = await db.query.users.findMany({
        //     where: and(
        //         eq(users.tenantId, session.user.tenantId),
        //         inArray(users.role, data.targetRoles)
        //     ),
        // });
        // 当前骨架：记录审计日志并返回成功
        await db.insert(auditLogs).values({
            tenantId: session.user.tenantId,
            action: 'SEND_BULK_NOTIFICATION',
            tableName: 'notifications',
            recordId: 'bulk',
            userId: session.user.id,
            newValues: data as Record<string, unknown>,
            createdAt: new Date(),
        });

        logger.info(`批量通知已发送: roles=${data.targetRoles.join(',')}, title=${data.title}`);
        return { success: true, data: { sentCount: 0, targetRoles: data.targetRoles } };
    } catch (error) {
        logger.error('批量通知发送失败:', error);
        return { success: false, error: '批量通知发送失败' };
    }
});

export async function sendBulkNotification(data: z.infer<typeof sendBulkNotificationSchema>) {
    return sendBulkNotificationInternal(data);
}
