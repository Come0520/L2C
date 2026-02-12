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
import { logger } from '@/shared/lib/logger';

/**
 * 系统设置 Server Actions
 * 提供配置的增删改查操作
 */

// 内存缓存（减少数据库查询）
const settingsCache = new Map<string, { data: Map<string, string>; expireAt: number }>();
const _CACHE_TTL = 5 * 60 * 1000; // 5 分钟

/**
 * 解析配置值
 */
function parseSettingValue(value: string, valueType: string): unknown {
  switch (valueType) {
    case 'BOOLEAN':
      return value === 'true';
    case 'INTEGER':
      return parseInt(value, 10);
    case 'DECIMAL':
      return parseFloat(value);
    case 'JSON':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case 'ENUM':
    default:
      return value;
  }
}

/**
 * 获取指定分类的所有配置
 */
export async function getSettingsByCategory(category: string) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('未授权');

  let settings = [];
  try {
    settings = await db.query.systemSettings.findMany({
      where: and(
        eq(systemSettings.tenantId, session.user.tenantId),
        eq(systemSettings.category, category)
      ),
    });
  } catch (error) {
    logger.error(`Failed to get settings for category ${category}:`, error);
    return {};
  }

  // 转换为对象格式
  const result: Record<string, unknown> = {};
  for (const setting of settings) {
    result[setting.key] = parseSettingValue(setting.value, setting.valueType);
  }

  return result;
}

/**
 * 获取单个配置值（带缓存）
 */
export async function getSetting(key: string, overrideTenantId?: string): Promise<unknown> {
  let tenantId = overrideTenantId;

  if (!tenantId) {
    const session = await auth();
    if (!session?.user?.tenantId) {
      // If explicit tenantId provided, we don't need auth session (internal/api call)
      // But if neither is present, throw.
      throw new Error('未授权');
    }
    tenantId = session.user.tenantId;
  }

  // 检查缓存
  const cached = settingsCache.get(tenantId);
  if (cached && cached.expireAt > Date.now() && cached.data.has(key)) {
    const setting = await db.query.systemSettings.findFirst({
      where: and(eq(systemSettings.tenantId, tenantId), eq(systemSettings.key, key)),
    });
    if (setting) {
      return parseSettingValue(setting.value, setting.valueType);
    }
  }

  // 从数据库获取
  let setting;
  try {
    setting = await db.query.systemSettings.findFirst({
      where: and(eq(systemSettings.tenantId, tenantId), eq(systemSettings.key, key)),
    });
  } catch (error) {
    logger.error(`Failed to get setting ${key}:`, error);
    const defaultSetting = DEFAULT_SYSTEM_SETTINGS.find((s) => s.key === key);
    if (defaultSetting) {
      return parseSettingValue(defaultSetting.value, defaultSetting.valueType);
    }
    return null;
  }

  if (!setting) {
    // 返回默认值
    const defaultSetting = DEFAULT_SYSTEM_SETTINGS.find((s) => s.key === key);
    if (defaultSetting) {
      return parseSettingValue(defaultSetting.value, defaultSetting.valueType);
    }
    throw new Error(`配置项 ${key} 不存在`);
  }

  return parseSettingValue(setting.value, setting.valueType);
}

/**
 * 更新单个配置
 */
export async function updateSetting(key: string, value: unknown) {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) throw new Error('未授权');

  // 权限校验：需要设置管理权限
  await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  // 查找现有配置
  const existing = await db.query.systemSettings.findFirst({
    where: and(eq(systemSettings.tenantId, tenantId), eq(systemSettings.key, key)),
  });

  if (!existing) {
    throw new Error(`配置项 ${key} 不存在`);
  }

  const newValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // 记录历史
  await db.insert(systemSettingsHistory).values({
    tenantId,
    settingId: existing.id,
    key,
    oldValue: existing.value,
    newValue,
    changedBy: userId,
  });

  // 更新配置
  await db
    .update(systemSettings)
    .set({
      value: newValue,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(systemSettings.id, existing.id));

  // 清除缓存
  settingsCache.delete(tenantId);

  revalidatePath('/settings');
  return { success: true };
}

/**
 * 批量更新配置
 */
export async function batchUpdateSettings(settings: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) throw new Error('未授权');

  // 权限校验：需要设置管理权限
  await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

  for (const [key, value] of Object.entries(settings)) {
    await updateSetting(key, value);
  }

  return { success: true };
}

/**
 * 初始化租户默认配置
 * 在创建新租户时调用
 */
export async function initTenantSettings(tenantId: string) {
  try {
    // 检查是否已初始化（通过查询任一配置项）
    const existing = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.tenantId, tenantId),
    });

    if (existing) {
      return { success: true, message: '配置已存在' };
    }

    // 逐条插入默认配置（静默处理冲突）
    for (const setting of DEFAULT_SYSTEM_SETTINGS) {
      try {
        await db
          .insert(systemSettings)
          .values({
            tenantId,
            category: setting.category,
            key: setting.key,
            value: setting.value,
            valueType: setting.valueType,
            description: setting.description,
          })
          .onConflictDoNothing();
      } catch {
        // 静默忽略单条插入失败（如重复键）
      }
    }

    return { success: true, message: '配置初始化完成' };
  } catch (error) {
    logger.error('initTenantSettings error:', error);
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

  // 按分类分组
  const grouped: Record<string, Record<string, unknown>> = {};
  for (const setting of allSettings) {
    if (!grouped[setting.category]) {
      grouped[setting.category] = {};
    }
    grouped[setting.category][setting.key] = parseSettingValue(setting.value, setting.valueType);
  }

  return grouped;
}
