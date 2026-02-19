'use server';

import { db, type Transaction, type DB } from '@/shared/api/db';
import { systemSettings } from '@/shared/api/schema/system-settings';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { type Session } from 'next-auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';
import { reminderRuleSchema } from './schema';

/**
 * 获取提醒规则列表
 *
 * @description 从系统设置中读取 REMINDER_RULES 配置项，
 * 解析并返回提醒规则数组。如果配置不存在则返回空数组。
 *
 * @returns Promise<ReminderRule[]> 提醒规则列表
 * @throws Error 未授权访问时抛出
 */
export async function getReminderRules(
  tx?: Transaction
): Promise<Array<z.infer<typeof reminderRuleSchema> & { id: string }>> {
  const session = await auth();
  if (!session?.user?.tenantId) return [];

  const runner: DB | Transaction = tx || db;
  const setting = await runner.query.systemSettings.findFirst({
    where: and(
      eq(systemSettings.tenantId, session.user.tenantId),
      eq(systemSettings.key, 'REMINDER_RULES')
    ),
  });

  if (!setting) return [];
  try {
    return JSON.parse(setting.value) as Array<z.infer<typeof reminderRuleSchema> & { id: string }>;
  } catch {
    return [];
  }
}

/**
 * 保存提醒规则 (内部方法)
 */
async function saveReminderRulesInternal(session: Session, rules: unknown[], tx?: Transaction) {
  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const runner: DB | Transaction = tx || db;

  const existing = await runner.query.systemSettings.findFirst({
    where: and(eq(systemSettings.tenantId, tenantId), eq(systemSettings.key, 'REMINDER_RULES')),
  });

  const jsonValue = JSON.stringify(rules);

  if (existing) {
    await runner
      .update(systemSettings)
      .set({ value: jsonValue, updatedAt: new Date(), updatedBy: userId })
      .where(eq(systemSettings.id, existing.id));
  } else {
    await runner.insert(systemSettings).values({
      tenantId,
      category: 'NOTIFICATION',
      key: 'REMINDER_RULES',
      value: jsonValue,
      valueType: 'JSON',
      updatedBy: userId,
    });
  }
}

/**
 * 创建提醒规则
 *
 * @description 创建新的提醒规则并持久化到系统设置。
 * 使用事务 + 行锁防止并发写入冲突。
 * 自动生成 UUID 作为规则 ID。
 *
 * @param data - 规则数据，包含 name, type, conditions, actions 等
 * @returns Promise<{ success: boolean; error?: string }> 创建结果
 */
export async function createReminderRule(data: z.infer<typeof reminderRuleSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, message: '未授权' };

  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const result = await db.transaction(async (tx) => {
      const rules = await getReminderRules(tx);
      const newRule = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      rules.push(newRule);

      await saveReminderRulesInternal(session, rules, tx);

      await AuditService.log(tx, {
        tableName: 'system_settings',
        recordId: 'REMINDER_RULES',
        action: 'CREATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: newRule,
      });

      return { success: true, message: '提醒规则创建成功' };
    });

    revalidatePath('/settings/notifications');
    return result;
  } catch (error: unknown) {
    console.error('Create reminder rule failed:', error);
    return { success: false, message: (error as Error).message || '创建失败' };
  }
}

/**
 * 更新提醒规则
 *
 * @description 更新指定 ID 的提醒规则。使用事务 + 行锁保证数据一致性。
 * 如果规则不存在则返回错误。
 *
 * @param ruleId - 目标规则 ID
 * @param data - 更新数据
 * @returns Promise<{ success: boolean; error?: string }> 更新结果
 */
export async function updateReminderRule(
  id: string,
  data: Partial<z.infer<typeof reminderRuleSchema>>
) {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, message: '未授权' };

  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const result = await db.transaction(async (tx) => {
      const rules = await getReminderRules(tx);
      const index = rules.findIndex((r) => r.id === id);
      if (index === -1) return { success: false, message: '规则不存在' };

      const oldRule = { ...rules[index] };
      rules[index] = { ...rules[index], ...data, updatedAt: new Date().toISOString() };

      await saveReminderRulesInternal(session, rules, tx);

      await AuditService.log(tx, {
        tableName: 'system_settings',
        recordId: 'REMINDER_RULES',
        action: 'UPDATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: oldRule,
        newValues: rules[index],
        changedFields: { id },
      });

      return { success: true, message: '提醒规则更新成功' };
    });

    revalidatePath('/settings/notifications');
    return result;
  } catch (error) {
    console.error('Update reminder rule failed:', error);
    return { success: false, message: '更新失败' };
  }
}

/**
 * 删除提醒规则
 *
 * @description 从规则列表中移除指定规则并持久化。
 * 使用事务 + 行锁防止并发冲突。
 *
 * @param ruleId - 目标规则 ID
 * @returns Promise<{ success: boolean; error?: string }> 删除结果
 */
export async function deleteReminderRule(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, message: '未授权' };

  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const result = await db.transaction(async (tx) => {
      const rules = await getReminderRules(tx);
      const ruleToDelete = rules.find((r) => r.id === id);
      if (!ruleToDelete) return { success: false, message: '规则不存在' };

      const newRules = rules.filter((r) => r.id !== id);
      await saveReminderRulesInternal(session, newRules, tx);

      await AuditService.log(tx, {
        tableName: 'system_settings',
        recordId: 'REMINDER_RULES',
        action: 'DELETE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: ruleToDelete,
      });

      return { success: true, message: '提醒规则已删除' };
    });

    revalidatePath('/settings/notifications');
    return result;
  } catch (error) {
    console.error('Delete reminder rule failed:', error);
    return { success: false, message: '删除失败' };
  }
}

/**
 * 启用/禁用提醒规则
 */
export async function toggleReminderRule(id: string, isActive: boolean) {
  return updateReminderRule(id, { isActive });
}
