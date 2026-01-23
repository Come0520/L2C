'use server';

import { db } from '@/shared/api/db';
import { financeConfigs } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import {
    type FinanceConfig,
    DEFAULT_FINANCE_CONFIG,
    configCache,
    CACHE_TTL
} from './finance-config-types';

// 注意：类型 FinanceConfig 需从 './finance-config-types' 导入
// 'use server' 文件不支持导出类型

/**
 * 获取财务配置（带缓存）
 */
export async function getFinanceConfigCached(tenantId: string): Promise<FinanceConfig> {
    // 检查缓存
    const cached = configCache.get(tenantId);
    if (cached && cached.expireAt > Date.now()) {
        return cached.config;
    }

    // 从数据库读取
    const configs = await db.query.financeConfigs.findMany({
        where: eq(financeConfigs.tenantId, tenantId),
    });

    // 构建配置对象
    const result: FinanceConfig = { ...DEFAULT_FINANCE_CONFIG };
    for (const c of configs) {
        try {
            const value = JSON.parse(c.configValue);
            if (c.configKey in result) {
                (result as any)[c.configKey] = value;
            }
        } catch {
            // 非 JSON 值直接赋值
            if (c.configKey in result) {
                (result as any)[c.configKey] = c.configValue;
            }
        }
    }

    // 更新缓存
    configCache.set(tenantId, {
        config: result,
        expireAt: Date.now() + CACHE_TTL,
    });

    return result;
}

// 注意：工具函数（clearFinanceConfigCache, isWithinAllowedDifference, getDifferenceHandlingResult, applyRounding）
// 直接从 './finance-config-utils' 导入，因为 'use server' 文件不能导出同步函数
