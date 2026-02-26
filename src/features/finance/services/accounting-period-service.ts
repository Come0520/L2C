import { db } from '@/shared/api/db';
import { accountingPeriods, journalEntries, financeAuditLogs } from '@/shared/api/schema';
import { eq, and, count } from 'drizzle-orm';

/**
 * 获取或自动创建当月账期 (Accounting Period)
 * @description 如果当前租户在当月没有账期记录，则自动创建并返回。主要用于自动记账和业务发生时的账期归属验证。
 * @param tenantId 当前操作的租户 ID
 * @returns 返回找到或新创建的账期记录对象
 */
export async function getOrCreateCurrentPeriod(tenantId: string): Promise<{
    id: string;
    year: number;
    month: number;
    quarter: number;
    status: 'OPEN' | 'CLOSED';
}> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    const [existing] = await db
        .select()
        .from(accountingPeriods)
        .where(and(
            eq(accountingPeriods.tenantId, tenantId),
            eq(accountingPeriods.year, year),
            eq(accountingPeriods.month, month)
        ));

    if (existing) return existing as { id: string; year: number; month: number; quarter: number; status: 'OPEN' | 'CLOSED' };

    // 自动创建账期
    const [created] = await db
        .insert(accountingPeriods)
        .values({ tenantId, year, month, quarter, status: 'OPEN' })
        .returning();

    return created as { id: string; year: number; month: number; quarter: number; status: 'OPEN' | 'CLOSED' };
}

/**
 * 关闭账期（不可逆操作）
 * 关闭前检查该账期内是否有未记账的凭证草稿
 */
export async function closeAccountingPeriod(
    periodId: string,
    operatorId: string,
    tenantId: string
): Promise<{ success: boolean; error?: string }> {
    // 1. 检查账期存在且当前为 OPEN
    const [period] = await db
        .select()
        .from(accountingPeriods)
        .where(and(eq(accountingPeriods.id, periodId), eq(accountingPeriods.tenantId, tenantId)));

    if (!period) return { success: false, error: '账期不存在' };
    if (period.status === 'CLOSED') return { success: false, error: '账期已关闭' };

    // 2. 检查是否有未记账的草稿凭证
    const [{ count: draftCount }] = await db
        .select({ count: count() })
        .from(journalEntries)
        .where(and(
            eq(journalEntries.periodId, periodId),
            eq(journalEntries.status, 'DRAFT')
        ));

    if (Number(draftCount) > 0) {
        return { success: false, error: `存在 ${draftCount} 张未记账草稿凭证，请先完成记账再关闭账期` };
    }

    // 3. 执行关账（OPEN → CLOSED，不可逆）
    return await db.transaction(async (tx) => {
        await tx
            .update(accountingPeriods)
            .set({ status: 'CLOSED', closedBy: operatorId, closedAt: new Date() })
            .where(eq(accountingPeriods.id, periodId));

        // 4. 记录审计日志
        await tx.insert(financeAuditLogs).values({
            tenantId,
            userId: operatorId,
            action: 'CLOSE_PERIOD',
            entityType: 'accounting_period',
            entityId: periodId,
            afterData: JSON.stringify({ closedAt: new Date().toISOString() }),
        });

        return { success: true };
    });
}

/**
 * 检查账期是否开放（供其他 Service 调用，写入前校验）
 */
export async function isPeriodOpen(periodId: string): Promise<boolean> {
    const [period] = await db
        .select({ status: accountingPeriods.status })
        .from(accountingPeriods)
        .where(eq(accountingPeriods.id, periodId));

    return period?.status === 'OPEN';
}
