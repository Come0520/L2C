'use server';

import { db } from '@/shared/api/db';
import { financeConfigs, financeAccounts } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { clearFinanceConfigCache } from '../services/finance-config-utils';
import {
    updateFinanceConfigSchema,
    createFinanceAccountSchema,
    updateFinanceAccountSchema
} from './schema';
import { z } from 'zod';

/**
 * 获取财务基础配置
 */
export async function getFinanceConfig() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const configs = await db.query.financeConfigs.findMany({
        where: eq(financeConfigs.tenantId, session.user.tenantId),
    });

    // 将数组转化为对象
    const configMap: Record<string, any> = {};
    configs.forEach(c => {
        try {
            configMap[c.configKey] = JSON.parse(c.configValue);
        } catch {
            configMap[c.configKey] = c.configValue;
        }
    });

    return configMap;
}

/**
 * 更新财务基础配置
 */
export async function updateFinanceConfig(data: z.infer<typeof updateFinanceConfigSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const validatedData = updateFinanceConfigSchema.parse(data);

    // 批量更新或插入
    for (const [key, value] of Object.entries(validatedData)) {
        const existing = await db.query.financeConfigs.findFirst({
            where: and(
                eq(financeConfigs.tenantId, session.user.tenantId),
                eq(financeConfigs.configKey, key)
            ),
        });

        if (existing) {
            await db.update(financeConfigs)
                .set({
                    configValue: JSON.stringify(value),
                    updatedAt: new Date()
                })
                .where(eq(financeConfigs.id, existing.id));
        } else {
            await db.insert(financeConfigs).values({
                tenantId: session.user.tenantId,
                configKey: key,
                configValue: JSON.stringify(value),
            });
        }
    }

    // 清除配置缓存，确保业务逻辑读取最新值
    clearFinanceConfigCache(session.user.tenantId);

    revalidatePath('/settings/finance');
    return { success: true };
}

/**
 * 获取所有财务账户
 */
export async function getFinanceAccounts() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.financeAccounts.findMany({
        where: eq(financeAccounts.tenantId, session.user.tenantId),
    });
}

/**
 * 创建财务账户
 */
export async function createFinanceAccount(data: z.infer<typeof createFinanceAccountSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const validatedData = createFinanceAccountSchema.parse(data);

    // 如果设置为默认账户，需要取消其他账户的默认状态
    if (validatedData.isDefault) {
        await db.update(financeAccounts)
            .set({ isDefault: false })
            .where(eq(financeAccounts.tenantId, session.user.tenantId));
    }

    const [account] = await db.insert(financeAccounts).values({
        ...validatedData,
        tenantId: session.user.tenantId,
        balance: '0', // 初始余额为0
    }).returning();

    revalidatePath('/settings/finance');
    return account;
}

/**
 * 更新财务账户
 */
export async function updateFinanceAccount(data: z.infer<typeof updateFinanceAccountSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const { id, ...updateData } = updateFinanceAccountSchema.parse(data);

    if (updateData.isDefault) {
        await db.update(financeAccounts)
            .set({ isDefault: false })
            .where(eq(financeAccounts.tenantId, session.user.tenantId));
    }

    const [updated] = await db.update(financeAccounts)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(and(
            eq(financeAccounts.id, id),
            eq(financeAccounts.tenantId, session.user.tenantId)
        ))
        .returning();

    revalidatePath('/settings/finance');
    return updated;
}
