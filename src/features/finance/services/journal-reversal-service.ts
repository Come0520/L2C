import { db } from '@/shared/api/db';
import { journalEntries, journalEntryLines, accountingPeriods, financeAuditLogs } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';

/**
 * 红字冲销：对已记账凭证生成反向冲销凭证
 * 规则：
 * - 原凭证必须处于 POSTED 状态
 * - 冲销凭证的所有借贷方向对调
 * - 原凭证不可删除，仅标记已被冲销
 * - 冲销凭证的 isReversal = true，reversedEntryId 指向原凭证
 */
export async function reverseJournalEntry(
    originalEntryId: string,
    operatorId: string,
    tenantId: string,
    description: string
): Promise<{ success: boolean; reversalEntryId?: string; error?: string }> {
    // 1. 查找原凭证
    const [originalEntry] = await db
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.id, originalEntryId), eq(journalEntries.tenantId, tenantId)));

    if (!originalEntry) {
        return { success: false, error: '凭证不存在' };
    }

    if (originalEntry.status !== 'POSTED') {
        return { success: false, error: '只有已记账的凭证才能冲销' };
    }

    // 2. 查找原凭证分录
    const originalLines = await db
        .select()
        .from(journalEntryLines)
        .where(eq(journalEntryLines.entryId, originalEntryId));

    // 3. 检查账期是否锁定
    const [period] = await db
        .select()
        .from(accountingPeriods)
        .where(eq(accountingPeriods.id, originalEntry.periodId));

    if (period?.status === 'CLOSED') {
        return { success: false, error: '账期已关闭，不能在已关闭账期内冲销，请在当前开放账期录入冲销凭证' };
    }

    return await db.transaction(async (tx) => {
        // 4. 生成冲销凭证编号
        const voucherNo = `CX-${Date.now()}`;

        // 5. 插入冲销凭证主记录
        const [reversalEntry] = await tx
            .insert(journalEntries)
            .values({
                tenantId,
                voucherNo,
                periodId: originalEntry.periodId,
                entryDate: new Date().toISOString().split('T')[0],
                description: description || `冲销凭证 ${originalEntry.voucherNo}`,
                status: 'DRAFT',
                sourceType: 'REVERSAL',
                isReversal: true,
                reversedEntryId: originalEntryId,
                totalDebit: originalEntry.totalCredit,   // 借贷对调
                totalCredit: originalEntry.totalDebit,
                createdBy: operatorId,
            })
            .returning();

        // 6. 插入对调后的分录行
        const reversalLines = originalLines.map((line, idx) => ({
            entryId: reversalEntry.id,
            accountId: line.accountId,
            debitAmount: line.creditAmount,   // 借贷对调
            creditAmount: line.debitAmount,
            description: `冲销：${line.description || ''}`,
            sortOrder: idx,
        }));

        await tx.insert(journalEntryLines).values(reversalLines);

        // 7. 记录审计日志
        await tx.insert(financeAuditLogs).values({
            tenantId,
            userId: operatorId,
            action: 'REVERSE',
            entityType: 'journal_entry',
            entityId: originalEntryId,
            afterData: JSON.stringify({ reversalEntryId: reversalEntry.id }),
        });

        return { success: true, reversalEntryId: reversalEntry.id };
    });
}
