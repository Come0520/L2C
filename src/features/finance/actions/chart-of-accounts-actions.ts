'use server';

import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { chartOfAccounts } from '@/shared/api/schema';
import { eq, or, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { accountCategoryEnum } from '@/shared/api/schema/enums';

import { CreateAccountInput, CreateAccountSchema, UpdateAccountInput, UpdateAccountSchema } from '../types/chart-of-accounts';

// 新建科目
export async function createChartOfAccount(data: CreateAccountInput) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: '未授权访问' };
    }

    const parseResult = CreateAccountSchema.safeParse(data);
    if (!parseResult.success) {
        return { error: '输入数据验证失败', details: parseResult.error.flatten() };
    }

    const { code, name, category, parentId, description } = parseResult.data;

    try {
        // 检查编码是否在当前租户内重复
        const existingCode = await db.query.chartOfAccounts.findFirst({
            where: and(
                eq(chartOfAccounts.tenantId, session.user.tenantId),
                eq(chartOfAccounts.code, code)
            ),
        });

        if (existingCode) {
            return { error: '该科目编码已存在' };
        }

        let level = 1;
        let finalCategory = category;

        // 如果有父级科目，需要继承大类分类并层级 +1
        if (parentId) {
            const parent = await db.query.chartOfAccounts.findFirst({
                where: and(
                    eq(chartOfAccounts.id, parentId),
                    eq(chartOfAccounts.tenantId, session.user.tenantId)
                ),
            });

            if (!parent) {
                return { error: '未找到指定的父级科目' };
            }

            finalCategory = parent.category; // 继承大类
            level = parent.level + 1; // 层级 +1
        }

        await db.insert(chartOfAccounts).values({
            tenantId: session.user.tenantId,
            code,
            name,
            category: finalCategory,
            parentId,
            level,
            description,
            isActive: true, // 默认开启
            isSystemDefault: false, // 手动添加的默认为非系统内置
        });

        revalidatePath('/finance/ledger');
        return { success: true };
    } catch (error) {
        console.error('新建科目失败:', error);
        return { error: '新建科目失败，请稍后重试' };
    }
}



// 编辑科目
export async function updateChartOfAccount(data: UpdateAccountInput) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: '未授权访问' };
    }

    const parseResult = UpdateAccountSchema.safeParse(data);
    if (!parseResult.success) {
        return { error: '输入数据验证失败', details: parseResult.error.flatten() };
    }

    const { id, code, name, description } = parseResult.data;

    try {
        const existingAccount = await db.query.chartOfAccounts.findFirst({
            where: and(
                eq(chartOfAccounts.id, id),
                eq(chartOfAccounts.tenantId, session.user.tenantId)
            ),
        });

        if (!existingAccount) {
            return { error: '未找到该科目' };
        }

        // 校验修改后的编码是否与当前租户内其他科目的编码冲突
        if (existingAccount.code !== code) {
            const codeConflict = await db.query.chartOfAccounts.findFirst({
                where: and(
                    eq(chartOfAccounts.tenantId, session.user.tenantId),
                    eq(chartOfAccounts.code, code)
                ),
            });

            if (codeConflict) {
                return { error: '该科目编码已被其他科目占用' };
            }
        }

        // 如果是系统内置科目，限制修改范围
        if (existingAccount.isSystemDefault) {
            // 仅允许更新描述
            await db.update(chartOfAccounts).set({ description }).where(eq(chartOfAccounts.id, id));
            revalidatePath('/finance/ledger');
            return { success: true, warning: '系统级科目仅允许修改说明。' };
        }

        // 允许修改
        await db.update(chartOfAccounts)
            .set({ code, name, description })
            .where(eq(chartOfAccounts.id, id));

        revalidatePath('/finance/ledger');
        return { success: true };
    } catch (error) {
        console.error('更新科目失败:', error);
        return { error: '更新科目失败，请稍后重试' };
    }
}

// 切换科目停启用状态
export async function toggleChartOfAccountStatus(id: string, newStatus: boolean) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: '未授权访问' };
    }

    if (!id) return { error: '缺少科目ID' };

    try {
        const existingAccount = await db.query.chartOfAccounts.findFirst({
            where: and(
                eq(chartOfAccounts.id, id),
                eq(chartOfAccounts.tenantId, session.user.tenantId)
            ),
        });

        if (!existingAccount) {
            return { error: '未找到该科目' };
        }

        if (existingAccount.isSystemDefault) {
            return { error: '系统内置科目不可停用或启用' };
        }

        await db.update(chartOfAccounts)
            .set({ isActive: newStatus })
            .where(eq(chartOfAccounts.id, id));

        revalidatePath('/finance/ledger');
        return { success: true };
    } catch (error) {
        console.error('切换科目状态失败:', error);
        return { error: '操作失败，请重试' };
    }
}

// 删除科目
export async function deleteChartOfAccount(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: '未授权访问' };
    }

    if (!id) return { error: '缺少科目ID' };

    try {
        const existingAccount = await db.query.chartOfAccounts.findFirst({
            where: and(
                eq(chartOfAccounts.id, id),
                eq(chartOfAccounts.tenantId, session.user.tenantId)
            ),
        });

        if (!existingAccount) {
            return { error: '未找到该科目' };
        }

        if (existingAccount.isSystemDefault) {
            return { error: '系统内置科目不可删除' };
        }

        // 验证是否包含子科目
        const childrenCount = await db.query.chartOfAccounts.findFirst({
            where: and(
                eq(chartOfAccounts.tenantId, session.user.tenantId),
                eq(chartOfAccounts.parentId, id)
            ),
        });

        if (childrenCount) {
            return { error: '请先删除所有相关的层级子科目，然后再删除本节点。' };
        }

        await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));

        revalidatePath('/finance/ledger');
        return { success: true };
    } catch (error) {
        console.error('删除科目失败:', error);
        return { error: '删除科目失败，可能是由于数据关联（如已绑定凭证）。请刷新页面重试' };
    }
}

// 获取所有科目
export async function getChartOfAccounts() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }

    try {
        const accounts = await db.query.chartOfAccounts.findMany({
            where: eq(chartOfAccounts.tenantId, session.user.tenantId),
            orderBy: (coa, { asc }) => [asc(coa.code)], // 默认按编码升序
        });

        return { success: true, data: accounts };
    } catch (error) {
        console.error('获取科目列表失败:', error);
        throw new Error('加载数据失败');
    }
}
