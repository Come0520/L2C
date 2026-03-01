'use server';

import { db } from '@/shared/api/db';
import { riskAlerts } from '@/shared/api/schema/traceability';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 告警规则引擎 Actions
 *
 * 负责告警规则的 CRUD 管理、批量通知发送以及基于模板的内容渲染。
 * 核心设计：
 * 1. 规则配置：复用 `riskAlerts` 表存储（`riskType` 存储条件，`affectedCount` 存储阈值）。
 * 2. 模板渲染：支持基于预设模板的变量替换（如 {count}, {days}）。
 * 3. 权限管控：仅允许拥有 `NOTIFICATION.MANAGE` 权限的用户操作规则。
 */

// ============================================================
// Schema 定义
// ============================================================

/** 告警触发条件类型枚举 */
const alertConditionEnum = z.enum([
  'ORDER_OVERDUE', // 订单超时未处理
  'APPROVAL_PENDING', // 审批待处理超时
  'PAYMENT_DUE', // 付款到期
  'INVENTORY_LOW', // 库存不足
  'CUSTOM', // 自定义条件
]);

/** 通知模板类型枚举 */
const notificationTemplateEnum = z.enum([
  'ORDER_OVERDUE', // 订单超时提醒模板
  'APPROVAL_PENDING', // 审批待处理模板
  'PAYMENT_DUE', // 付款到期模板
  'INVENTORY_LOW', // 库存不足模板
  'CUSTOM', // 自定义模板
]);

/** 创建告警规则参数校验接口 */
const createAlertRuleSchema = z.object({
  /** 规则显示名称 */
  name: z.string().min(1, '告警规则名称不能为空'),
  /** 触发条件分类 */
  condition: alertConditionEnum,
  /** 超时阈值（天） */
  thresholdDays: z.number().min(1).max(90),
  /** 目标播送角色组 */
  targetRoles: z.array(z.string().min(1)).min(1, '至少指定一个目标角色'),
  /** 渲染时使用的通知模板 */
  notificationTemplate: notificationTemplateEnum,
  /** 是否启用标识 */
  isEnabled: z.boolean().default(true),
  /** 规则备注信息 */
  description: z.string().optional(),
});

/** 删除规则参数校验 */
const deleteAlertRuleSchema = z.object({
  /** 规则 ID */
  ruleId: z.string().min(1),
});

/** 更新规则参数校验 */
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

/** 批量发送通知参数校验 */
const sendBulkNotificationSchema = z.object({
  /** 目标接收角色列表 */
  targetRoles: z.array(z.string().min(1)).min(1, '至少指定一个目标角色'),
  /** 消息标题 */
  title: z.string().min(1, '标题不能为空'),
  /** 消息正文 */
  content: z.string().min(1, '内容不能为空'),
  /** 消息等级：INFO, WARNING, ERROR */
  type: z.enum(['INFO', 'WARNING', 'ERROR']).default('INFO'),
  /** 跳转链接 */
  link: z.string().optional(),
});

// ============================================================
// 通知模板定义
// ============================================================

/**
 * 预设通知模板映射表
 * 定义了标题与内容的骨架，支持动态占位符（如 {count}, {days}）
 */
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
 * 将指定模板与业务数据进行合并渲染
 *
 * @param templateName - 使用的模板 ID
 * @param params - 需要替换的变量键值对（如 { count: 5 }）
 * @returns 最终生成的标题和内容字符串
 *
 * @example
 * ```ts
 * renderTemplate('ORDER_OVERDUE', { count: 10, days: 3 })
 * ```
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
// 速率限制器 (Rate Limiter) - 防止告警风暴
// ============================================================

/**
 * 内存级滑动窗口速率限制器
 * 用于防止告警风暴时短时间内产生海量通知调用（导致三方通道或数据库压力剧增）
 *
 * @param maxCalls - 窗口期内允许的最大调用次数
 * @param windowMs - 滑动窗口时长（毫秒）
 */
function createRateLimiter(maxCalls: number, windowMs: number) {
  const callTimestamps: number[] = [];
  return {
    /** 尝试获取调用令牌，若超限则返回 false */
    tryAcquire(): boolean {
      const now = Date.now();
      // 清理掉滑动窗口期之前的过期时间戳
      while (callTimestamps.length > 0 && callTimestamps[0] <= now - windowMs) {
        callTimestamps.shift();
      }
      if (callTimestamps.length >= maxCalls) {
        return false;
      }
      callTimestamps.push(now);
      return true;
    },
    /** 重置计数器（主要用于测试） */
    reset() {
      callTimestamps.length = 0;
    },
  };
}

/** 全局通知速率限制器：设置每分钟最高 100 次通知派发 */
const notificationRateLimiter = createRateLimiter(100, 60_000);

/** 暴露重置接口供外部测试套件使用 */
export function resetRateLimiterForTest() {
  notificationRateLimiter.reset();
}

// ============================================================
// Actions
// ============================================================

/**
 * 创建新的告警规则
 * 复用 `riskAlerts` 表存储告警配置，需要 `NOTIFICATION.MANAGE` 权限应遵守限流策略。
 *
 * @param data - 规则定义对象
 * @returns 操作结果
 */
const createAlertRuleInternal = createSafeAction(
  createAlertRuleSchema,
  async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    // 防护：防止恶意或失控脚本短时间内创建海量规则
    if (!notificationRateLimiter.tryAcquire()) {
      logger.warn('系统触发限流保护：告警规则创建频率过高', { tenantId: session.user.tenantId });
      // 需要 throw 让 createSafeAction 捕获，才能在顶层返回 success: false
      throw new Error('操作过于频繁，请稍后再试');
    }

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

      // 接入 AuditService 审计日志
      await AuditService.log(db, {
        tenantId: session.user.tenantId,
        action: 'CREATE_ALERT_RULE',
        tableName: 'risk_alerts',
        recordId: 'new',
        userId: session.user.id,
        newValues: data as Record<string, unknown>,
      });

      logger.info(`告警规则已创建: name=${data.name}, condition=${data.condition}`);
      return { success: true };
    } catch (error) {
      logger.error('创建告警规则失败:', error);
      return { success: false, error: '创建告警规则失败' };
    }
  }
);

export async function createAlertRule(data: z.input<typeof createAlertRuleSchema>) {
  return createAlertRuleInternal(data as z.infer<typeof createAlertRuleSchema>);
}

/**
 * 查询当前归属租户的所有告警规则列表
 *
 * @returns 包含规则数组的列表
 */
const listAlertRulesInternal = createSafeAction(
  listAlertRulesSchema,
  async (_data, { session }) => {
    const startTime = Date.now();
    const rules = await db
      .select()
      .from(riskAlerts)
      .where(eq(riskAlerts.tenantId, session.user.tenantId!));
    const durationMs = Date.now() - startTime;

    logger.info('告警规则查询完成', {
      tenantId: session.user.tenantId,
      count: rules.length,
      durationMs,
    });

    return { success: true, data: rules };
  }
);

export async function listAlertRules() {
  return listAlertRulesInternal({});
}

/**
 * 删除指定的告警规则
 * 支持多租户逻辑隔离校验，需要 `NOTIFICATION.MANAGE` 权限。
 *
 * @param data - 包含要删除的 ruleId
 * @returns 操作结果
 */
const deleteAlertRuleInternal = createSafeAction(
  deleteAlertRuleSchema,
  async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    try {
      // 确保只能删除自己租户的规则
      await db
        .delete(riskAlerts)
        .where(
          and(eq(riskAlerts.id, data.ruleId), eq(riskAlerts.tenantId, session.user.tenantId!))
        );

      // 接入 AuditService 审计日志
      await AuditService.log(db, {
        tenantId: session.user.tenantId,
        action: 'DELETE_ALERT_RULE',
        tableName: 'risk_alerts',
        recordId: data.ruleId,
        userId: session.user.id,
        newValues: { deletedRuleId: data.ruleId },
      });
      logger.info(`告警规则已删除: ruleId=${data.ruleId}`);
      return { success: true };
    } catch (error) {
      logger.error('删除告警规则失败:', error);
      return { success: false, error: '删除告警规则失败' };
    }
  }
);

export async function deleteAlertRule(data: z.infer<typeof deleteAlertRuleSchema>) {
  return deleteAlertRuleInternal(data);
}

/**
 * 更新现有告警规则的配置
 * 仅允许修改已存在的且属于当前租户的规则。需要 `NOTIFICATION.MANAGE` 权限。
 *
 * @param data - 待更新的规则部分字段及 ruleId
 * @returns 操作结果
 */
const updateAlertRuleInternal = createSafeAction(
  updateAlertRuleSchema,
  async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    try {
      const { ruleId, ...updateData } = data;

      const dbUpdate: Partial<typeof riskAlerts.$inferInsert> = { updatedAt: new Date() };
      if (updateData.name !== undefined) dbUpdate.title = updateData.name;
      if (updateData.condition !== undefined) dbUpdate.riskType = updateData.condition;
      if (updateData.description !== undefined) dbUpdate.description = updateData.description;
      if (updateData.isEnabled !== undefined)
        dbUpdate.status = updateData.isEnabled ? 'OPEN' : 'IGNORED';
      if (updateData.thresholdDays !== undefined)
        dbUpdate.affectedCount = String(updateData.thresholdDays);

      // 仅当两个相关参数都提供时简单更新建议，不然维持原状
      if (updateData.notificationTemplate && updateData.thresholdDays) {
        dbUpdate.suggestedAction = `模板: ${updateData.notificationTemplate}, 阈值: ${updateData.thresholdDays}天`;
      }

      const result = await db
        .update(riskAlerts)
        .set(dbUpdate)
        .where(and(eq(riskAlerts.id, ruleId), eq(riskAlerts.tenantId, session.user.tenantId!)))
        .returning({ id: riskAlerts.id });

      if (!result.length) {
        return { success: false, error: '未找到该告警规则或无权操作' };
      }

      // 接入 AuditService 审计日志
      await AuditService.log(db, {
        tenantId: session.user.tenantId,
        action: 'UPDATE_ALERT_RULE',
        tableName: 'risk_alerts',
        recordId: ruleId,
        userId: session.user.id,
        newValues: updateData as Record<string, unknown>,
      });

      logger.info(`告警规则已更新: ruleId=${ruleId}`);
      return { success: true };
    } catch (error) {
      logger.error('更新告警规则失败:', error);
      return { success: false, error: '更新告警规则失败' };
    }
  }
);

export async function updateAlertRule(data: z.infer<typeof updateAlertRuleSchema>) {
  return updateAlertRuleInternal(data);
}

/**
 * 向特定角色的用户组批量播送通知消息
 *
 * @remarks
 * 当前实现为审计级骨架版本。
 * 计划中的企业级实现应通过 DB 查询目标角色的用户清单，并调用推送接口实现逐一分发。
 * 需要 `NOTIFICATION.MANAGE` 权限。
 *
 * @param data - 播送范围、标题及正文内容
 * @returns 发送计数及目标范围
 */
const sendBulkNotificationInternal = createSafeAction(
  sendBulkNotificationSchema,
  async (data, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    // 防风暴：批量通知下发路径必须受限
    if (!notificationRateLimiter.tryAcquire()) {
      logger.warn('系统触发限流保护：批量通知下发频率过快', { tenantId: session.user.tenantId });
      // 需要 throw 让 createSafeAction 捕获，才能在顶层返回 success: false
      throw new Error('系统通知繁忙，请稍后再试');
    }

    try {
      // 实际实现应查询 targetRoles 对应的用户列表并由 L3/L4 异步发信微服务接管下发
      // 当前骨架版：仅记录审计日志和日志
      await AuditService.log(db, {
        tenantId: session.user.tenantId,
        action: 'SEND_BULK_NOTIFICATION',
        tableName: 'notifications',
        recordId: 'bulk',
        userId: session.user.id,
        newValues: data as Record<string, unknown>,
      });

      logger.info(`批量通知已发送: roles=${data.targetRoles.join(',')}, title=${data.title}`);
      return { success: true, data: { sentCount: 0, targetRoles: data.targetRoles } };
    } catch (error) {
      logger.error('批量通知发送失败:', error);
      return { success: false, error: '批量通知发送失败' };
    }
  }
);

export async function sendBulkNotification(data: z.infer<typeof sendBulkNotificationSchema>) {
  return sendBulkNotificationInternal(data);
}
