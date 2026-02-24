'use server';



import { db } from '@/shared/api/db';
import { financeConfigs, financeAccounts } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidateTag } from 'next/cache';
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

    // 权限检查：查看财务配置
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

    const configs = await db.query.financeConfigs.findMany({
        where: eq(financeConfigs.tenantId, session.user.tenantId),
    });

    // 将数组转化为对象
    const configMap: Record<string, unknown> = {};
    configs.forEach(c => {
        try {
            configMap[c.configKey] = JSON.parse(c.configValue);
        } catch {
            configMap[c.configKey] = c.configValue;
        }
    });

    return configMap;
}

import { AuditService } from '@/shared/services/audit-service';

/**
 * 更新财务基础配置
 */
export async function updateFinanceConfig(data: z.infer<typeof updateFinanceConfigSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：财务管理
    if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) throw new Error('权限不足：需要财务管理权限');

    const validatedData = updateFinanceConfigSchema.parse(data);

    // 批量更新或插入
    await db.transaction(async (tx) => {
        for (const [key, value] of Object.entries(validatedData)) {
            const existing = await tx.query.financeConfigs.findFirst({
                where: and(
                    eq(financeConfigs.tenantId, session.user.tenantId),
                    eq(financeConfigs.configKey, key)
                ),
            });

            if (existing) {
                await tx.update(financeConfigs)
                    .set({
                        configValue: JSON.stringify(value),
                        updatedAt: new Date()
                    })
                    .where(eq(financeConfigs.id, existing.id));

                await AuditService.log(tx, {
                    tenantId: session.user.tenantId!,
                    userId: session.user.id!,
                    tableName: 'finance_configs',
                    recordId: existing.id,
                    action: 'UPDATE',
                    newValues: { configValue: value },
                    oldValues: { configValue: existing.configValue },
                    details: { configKey: key }
                });
            } else {
                const [inserted] = await tx.insert(financeConfigs).values({
                    tenantId: session.user.tenantId,
                    configKey: key,
                    configValue: JSON.stringify(value),
                }).returning();

                await AuditService.log(tx, {
                    tenantId: session.user.tenantId!,
                    userId: session.user.id!,
                    tableName: 'finance_configs',
                    recordId: inserted.id,
                    action: 'INSERT',
                    newValues: { configKey: key, configValue: value }
                });
            }
        }
    });

    // 清除配置缓存，确保业务逻辑读取最新值
    clearFinanceConfigCache(session.user.tenantId);

    revalidateTag(`finance-config-${session.user.tenantId}`, 'default');
    return { success: true };
}

/**
 * 获取所有财务账户
 */
export async function getFinanceAccounts() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：查看财务账户
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

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

    // 权限检查：财务管理
    if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) throw new Error('权限不足：需要财务管理权限');

    const validatedData = createFinanceAccountSchema.parse(data);

    const account = await db.transaction(async (tx) => {
        // 如果设置为默认账户，需要取消其他账户的默认状态
        if (validatedData.isDefault) {
            await tx.update(financeAccounts)
                .set({ isDefault: false })
                .where(eq(financeAccounts.tenantId, session.user.tenantId!));
        }

        const [newAccount] = await tx.insert(financeAccounts).values({
            ...validatedData,
            tenantId: session.user.tenantId!,
            balance: '0', // 初始余额为0
        }).returning();

        await AuditService.log(tx, {
            tenantId: session.user.tenantId!,
            userId: session.user.id!,
            tableName: 'finance_accounts',
            recordId: newAccount.id,
            action: 'INSERT',
            newValues: newAccount
        });

        return newAccount;
    });

    revalidateTag(`finance-config-${session.user.tenantId}`, 'default');
    return account;
}

/**
 * 更新财务账户
 */
export async function updateFinanceAccount(data: z.infer<typeof updateFinanceAccountSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：财务管理
    if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) throw new Error('权限不足：需要财务管理权限');

    const { id, ...updateData } = updateFinanceAccountSchema.parse(data);

    const updated = await db.transaction(async (tx) => {
        const existing = await tx.query.financeAccounts.findFirst({
            where: and(
                eq(financeAccounts.id, id),
                eq(financeAccounts.tenantId, session.user.tenantId!)
            )
        });

        if (!existing) throw new Error('账户不存在');

        if (updateData.isDefault) {
            await tx.update(financeAccounts)
                .set({ isDefault: false })
                .where(eq(financeAccounts.tenantId, session.user.tenantId!));
        }

        const [updatedAccount] = await tx.update(financeAccounts)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(and(
                eq(financeAccounts.id, id),
                eq(financeAccounts.tenantId, session.user.tenantId!)
            ))
            .returning();

        await AuditService.log(tx, {
            tenantId: session.user.tenantId!,
            userId: session.user.id!,
            tableName: 'finance_accounts',
            recordId: id,
            action: 'UPDATE',
            newValues: updateData,
            oldValues: existing
        });

        return updatedAccount;
    });

    revalidateTag(`finance-config-${session.user.tenantId}`, 'default');
    return updated;
}
