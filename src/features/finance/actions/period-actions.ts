'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { accountingPeriods, users, journalEntries } from '@/shared/api/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getFinanceMode } from './simple-mode-actions';
import { canClosePeriod } from '../utils/finance-permissions';

// 获取当月账期或自动创建一个新账期
export async function getOrCreateCurrentPeriod() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: '未授权访问' };
    }

    const tenantId = session.user.tenantId;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const quarter = Math.ceil(month / 3);

    try {
        // 检查账期是否存在
        let currentPeriod = await db.query.accountingPeriods.findFirst({
            where: and(
                eq(accountingPeriods.tenantId, tenantId),
                eq(accountingPeriods.year, year),
                eq(accountingPeriods.month, month)
            ),
        });

        // 若不存在，则创建
        if (!currentPeriod) {
            const inserted = await db.insert(accountingPeriods)
                .values({
                    tenantId,
                    year,
                    month,
                    quarter,
                    status: 'OPEN',
                })
                .returning();

            currentPeriod = inserted[0];
            revalidatePath('/finance/periods');
        }

        return { success: true, data: currentPeriod };
    } catch (error) {
        console.error('获取或创建账期失败:', error);
        return { error: '获取账期数据失败，请重试' };
    }
}

// 获取全部账期列表 (带有关账人信息)
export async function getAccountingPeriods() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }

    const tenantId = session.user.tenantId;

    try {
        const periods = await db.query.accountingPeriods.findMany({
            where: eq(accountingPeriods.tenantId, tenantId),
            orderBy: [desc(accountingPeriods.year), desc(accountingPeriods.month)],
        });
        const closedByIds = periods.map((p) => p.closedBy).filter(Boolean) as string[];
        let userMap: Record<string, string> = {};

        if (closedByIds.length > 0) {
            const closedUsers = await db.query.users.findMany({
                where: inArray(users.id, Array.from(new Set(closedByIds))),
                columns: {
                    id: true,
                    name: true,
                },
            });

            userMap = closedUsers.reduce((acc, u) => {
                acc[u.id] = u.name || '未知用户';
                return acc;
            }, {} as Record<string, string>);
        }

        const dataWithUsers = periods.map((p) => ({
            ...p,
            closedByName: p.closedBy ? userMap[p.closedBy] : null,
        }));

        return { success: true, data: dataWithUsers };

    } catch (error) {
        console.error('获取账期列表失败:', error);
        throw new Error('加载数据失败');
    }
}

export async function closeAccountingPeriod(periodId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { error: '未授权访问' };
    }

    const roles = session.user.roles || [session.user.role];
    const modeRes = await getFinanceMode();
    const isSimpleMode = modeRes.success && modeRes.mode === 'simple';

    if (!canClosePeriod(roles, isSimpleMode)) {
        return { error: '权限不足：只有财务主管或同等级别管理员可进行账期关闭操作！' };
    }

    if (!periodId) return { error: '缺少账期 ID' };

    try {
        const targetPeriod = await db.query.accountingPeriods.findFirst({
            where: and(
                eq(accountingPeriods.id, periodId),
                eq(accountingPeriods.tenantId, session.user.tenantId)
            ),
        });

        if (!targetPeriod) {
            return { error: '找不到指定的账期记录' };
        }

        if (targetPeriod.status === 'CLOSED') {
            return { error: '该账期已经关闭，不可重复操作' };
        }

        // 可选校验：是否存在未记账的凭证
        const pendingJournals = await db.query.journalEntries.findFirst({
            where: and(
                eq(journalEntries.periodId, periodId),
                eq(journalEntries.tenantId, session.user.tenantId),
                // 查询非 POSTED(已记账) 的凭证
                inArray(journalEntries.status, ['DRAFT', 'PENDING_REVIEW'])
            )
        });

        if (pendingJournals) {
            return { error: '该账期下尚有未记账或待审核的凭证，无法关闭！' };
        }

        await db.update(accountingPeriods)
            .set({
                status: 'CLOSED',
                closedBy: session.user.id,
                closedAt: new Date(),
            })
            .where(eq(accountingPeriods.id, periodId));

        revalidatePath('/finance/periods');
        return { success: true };
    } catch (error) {
        console.error('关闭账期失败:', error);
        return { error: '关闭账期处理失败，请稍后重试' };
    }
}
