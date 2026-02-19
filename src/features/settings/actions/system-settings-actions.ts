'use server';

import { db } from '@/shared/api/db';
import {
  systemSettings,
  systemSettingsHistory,
  DEFAULT_SYSTEM_SETTINGS,
} from '@/shared/api/schema/system-settings';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { parseSettingValue, validateValueType } from './setting-utils';

/**
 * 输入校验 Schema
 * 防止恶意输入注入和格式错误
 */
const categorySchema = z.string()
  .min(1, '分类标识不能为空')
  .max(50, '分类标识过长')
  .regex(/^[a-z][a-z0-9_-]*$/i, '分类标识仅允许字母、数字、下划线和连字符');

const settingKeySchema = z.string()
  .min(1, '配置键不能为空')
  .max(100, '配置键过长')
  .regex(/^[a-z][a-z0-9_.:-]*$/i, '配置键格式不合法');

const batchSettingsSchema = z.record(
  settingKeySchema,
  z.unknown()
).refine(obj => Object.keys(obj).length > 0, '至少需要一个配置项')
  .refine(obj => Object.keys(obj).length <= 50, '单次最多更新 50 个配置项');

/**
 * 系统设置 Server Actions
 * 提供配置的增删改查操作
 */

/**
 * 根据分类获取系统设置
 *
 * @description 获取当前租户下指定分类的所有系统设置。
 * 自动解析每个配置项的值类型（BOOLEAN/INTEGER/DECIMAL/JSON/ENUM）。
 *
 * @param category - 设置分类标识，例如 'crm', 'finance'
 * @returns Promise<Record<string, unknown>> 返回键值对形式的设置对象
 * @throws Error 未授权访问时抛出
 */
export async function getSettingsByCategory(category: string) {
  const parsed = categorySchema.safeParse(category);
  if (!parsed.success) throw new Error(`参数校验失败: ${parsed.error.issues[0].message}`);

  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('未授权');

  try {
    const settings = await db.query.systemSettings.findMany({
      where: and(
        eq(systemSettings.tenantId, session.user.tenantId),
        eq(systemSettings.category, category)
      ),
    });

    const result: Record<string, unknown> = {};
    for (const setting of settings) {
      result[setting.key] = parseSettingValue(setting.value, setting.valueType);
    }

    return result;
  } catch (error) {
    console.error(`获取分类 ${category} 的配置失败:`, error);
    return {};
  }
}

/**
 * 获取单个配置值 (供内部服务层调用，不导出为 Server Action)
 */
export async function getSettingInternal(key: string, tenantId: string): Promise<unknown> {
  try {
    const setting = await db.query.systemSettings.findFirst({
      where: and(eq(systemSettings.tenantId, tenantId), eq(systemSettings.key, key)),
    });

    if (setting) {
      return parseSettingValue(setting.value, setting.valueType);
    }

    // 返回默认值
    const defaultSetting = DEFAULT_SYSTEM_SETTINGS.find((s) => s.key === key);
    if (defaultSetting) {
      return parseSettingValue(defaultSetting.value, defaultSetting.valueType);
    }

    throw new Error(`配置项 ${key} 不存在`);
  } catch (error) {
    console.error(`获取配置项 ${key} 失败:`, error);
    const defaultSetting = DEFAULT_SYSTEM_SETTINGS.find((s) => s.key === key);
    if (defaultSetting) {
      return parseSettingValue(defaultSetting.value, defaultSetting.valueType);
    }
    return null;
  }
}

/**
 * 获取当前租户的配置值 (导出为 Server Action)
 */
export async function getSetting(key: string): Promise<unknown> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  return getSettingInternal(key, session.user.tenantId);
}

/**
 * 更新单个配置 Internal (用于事务内调用)
 */
async function updateSettingInternal(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  key: string,
  value: unknown,
  tenantId: string,
  userId: string
) {
  const existing = await tx.query.systemSettings.findFirst({
    where: and(eq(systemSettings.tenantId, tenantId), eq(systemSettings.key, key)),
  });

  if (!existing) {
    throw new Error(`配置项 ${key} 不存在`);
  }

  if (!validateValueType(value, existing.valueType)) {
    throw new Error(`配置项 ${key} 的值类型不匹配，预期 ${existing.valueType}`);
  }

  const newValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // 记录历史
  await tx.insert(systemSettingsHistory).values({
    tenantId,
    settingId: existing.id,
    key,
    oldValue: existing.value,
    newValue,
    changedBy: userId,
  });

  // 更新配置
  await tx
    .update(systemSettings)
    .set({
      value: newValue,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(systemSettings.id, existing.id));
}

/**
 * 更新单个配置
 */
export async function updateSetting(key: string, value: unknown) {
  const parsed = settingKeySchema.safeParse(key);
  if (!parsed.success) throw new Error(`配置键校验失败: ${parsed.error.issues[0].message}`);

  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) throw new Error('未授权');

  await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  await db.transaction(async (tx) => {
    await updateSettingInternal(tx, key, value, tenantId, userId);
  });

  revalidatePath('/settings');
  return { success: true };
}

/**
 * 批量更新系统设置
 *
 * @description 同时更新多个配置项。在事务中逐项进行类型校验和更新，
 * 并记录变更历史。如果任一项校验失败，整个事务回滚。
 *
 * @param settings - 键值对形式的配置更新对象，key 为配置名，value 为新值
 * @returns Promise<{ success: boolean }> 更新结果
 * @throws Error 未授权访问或权限不足时抛出
 */
export async function batchUpdateSettings(settings: Record<string, unknown>) {
  const parsed = batchSettingsSchema.safeParse(settings);
  if (!parsed.success) throw new Error(`批量配置校验失败: ${parsed.error.issues[0].message}`);

  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) throw new Error('未授权');

  await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(settings)) {
      await updateSettingInternal(tx, key, value, tenantId, userId);
    }
  });

  revalidatePath('/settings');
  return { success: true };
}

/**
 * 初始化租户默认设置
 *
 * @description 为租户创建默认的系统设置项。通常在租户创建或初始化时调用。
 * 使用 `onConflictDoNothing` 策略，仅当设置项不存在时才创建，不会覆盖现有配置。
 *
 * @param tenantId - 目标租户 ID
 * @returns Promise<{ success: boolean; message?: string; error?: string }> 初始化结果
 */
export async function initTenantSettings(tenantId: string) {
  try {
    await db.transaction(async (tx) => {
      const existing = await tx.query.systemSettings.findFirst({
        where: eq(systemSettings.tenantId, tenantId),
      });

      if (existing) return;

      const valuesToInsert = DEFAULT_SYSTEM_SETTINGS.map((setting) => ({
        tenantId,
        category: setting.category,
        key: setting.key,
        value: setting.value,
        valueType: setting.valueType,
        description: setting.description,
      }));

      if (valuesToInsert.length > 0) {
        await tx.insert(systemSettings).values(valuesToInsert).onConflictDoNothing();
      }
    });

    return { success: true, message: '配置初始化完成' };
  } catch (error) {
    console.error('initTenantSettings error:', error);
    return { success: false, error: '配置初始化失败' };
  }
}

/**
 * 获取所有配置（按分类分组）
 */
export async function getAllSettings() {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('未授权');

  const allSettings = await db.query.systemSettings.findMany({
    where: eq(systemSettings.tenantId, session.user.tenantId),
  });

  const grouped: Record<string, Record<string, unknown>> = {};
  for (const setting of allSettings) {
    if (!grouped[setting.category]) {
      grouped[setting.category] = {};
    }
    grouped[setting.category][setting.key] = parseSettingValue(setting.value, setting.valueType);
  }

  return grouped;
}
