import { db } from '@/shared/api/db';
import { journalEntryLines } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

/**
 * 校验凭证借贷是否平衡
 * 规则：所有分录的借方合计必须严格等于贷方合计
 */
export async function validateJournalBalance(entryId: string): Promise<{
    isValid: boolean;
    totalDebit: string;
    totalCredit: string;
    difference: string;
}> {
    const lines = await db
        .select()
        .from(journalEntryLines)
        .where(eq(journalEntryLines.entryId, entryId));

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
        totalDebit += parseFloat(line.debitAmount);
        totalCredit += parseFloat(line.creditAmount);
    }

    // 使用精度比较，避免浮点误差（保留2位小数）
    const debitStr = totalDebit.toFixed(2);
    const creditStr = totalCredit.toFixed(2);
    const difference = (totalDebit - totalCredit).toFixed(2);

    return {
        isValid: debitStr === creditStr,
        totalDebit: debitStr,
        totalCredit: creditStr,
        difference,
    };
}

/**
 * 校验单组分录行（新建凭证时前端传入，尚未落库）
 * 用于 Server Action 中在 INSERT 前进行校验
 */
export function validateLinesBalance(lines: Array<{
    debitAmount: string;
    creditAmount: string;
}>): { isValid: boolean; totalDebit: string; totalCredit: string } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
        totalDebit += parseFloat(line.debitAmount || '0');
        totalCredit += parseFloat(line.creditAmount || '0');
    }

    const debitStr = totalDebit.toFixed(2);
    const creditStr = totalCredit.toFixed(2);

    return {
        isValid: debitStr === creditStr,
        totalDebit: debitStr,
        totalCredit: creditStr,
    };
}
