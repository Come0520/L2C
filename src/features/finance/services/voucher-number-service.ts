import { db } from '@/shared/api/db';
import { journalEntries } from '@/shared/api/schema';
import { eq, and, like, max } from 'drizzle-orm';

/**
 * 生成标准格式凭证编号
 * 格式：类型前缀-YYYY-MM-NNN（三位自增序号，当月唯一）
 *
 * 示例：
 *   手工凭证   → PZ-2026-02-001
 *   自动收款   → RCV-2026-02-001
 *   自动付款   → PAY-2026-02-001
 *   红字冲销   → CX-2026-02-001
 *
 * 并发安全说明：此函数需在数据库事务内调用，确保并发场景下序号不重复。
 */
export async function generateVoucherNo(
    tenantId: string,
    sourceType: 'MANUAL' | 'AUTO_RECEIPT' | 'AUTO_PAYMENT' | 'AUTO_EXPENSE' | 'AUTO_TRANSFER' | 'AUTO_PURCHASE' | 'AUTO_ORDER' | 'REVERSAL',
    now: Date = new Date()
): Promise<string> {
    // 根据来源类型映射前缀
    const prefixMap: Record<string, string> = {
        MANUAL: 'PZ',
        AUTO_RECEIPT: 'RCV',
        AUTO_PAYMENT: 'PAY',
        AUTO_EXPENSE: 'EXP',
        AUTO_TRANSFER: 'TRF',
        AUTO_PURCHASE: 'PUR',
        AUTO_ORDER: 'SLS',
        REVERSAL: 'CX',
    };
    const prefix = prefixMap[sourceType] ?? 'PZ';

    const year = now.getFullYear();
    // 月份补零（01~12）
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // 当月前缀，用于 LIKE 匹配
    const currentMonthPrefix = `${prefix}-${year}-${month}-`;

    // 查询当月该前缀下的最大序号
    const [result] = await db
        .select({ maxNo: max(journalEntries.voucherNo) })
        .from(journalEntries)
        .where(and(
            eq(journalEntries.tenantId, tenantId),
            like(journalEntries.voucherNo, `${currentMonthPrefix}%`)
        ));

    let nextSeq = 1;

    if (result?.maxNo) {
        // 从 "PZ-2026-02-007" 中提取序号 7
        const parts = result.maxNo.split('-');
        const lastSeqStr = parts[parts.length - 1];
        const lastSeq = parseInt(lastSeqStr, 10);
        if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
        }
    }

    // 格式化为三位数序号，最大 999
    if (nextSeq > 999) {
        throw new Error(`当月 ${currentMonthPrefix} 凭证编号已超上限（999张），请联系管理员扩容序号位数`);
    }
    const seqStr = String(nextSeq).padStart(3, '0');

    return `${currentMonthPrefix}${seqStr}`;
}
