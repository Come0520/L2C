import { db, type Transaction } from "@/shared/api/db";
import { afterSalesTickets, liabilityNotices } from "@/shared/api/schema/after-sales";
import { sql, and, eq, desc } from 'drizzle-orm';

/**
 * 生成售后工单编号 (AS + YYYYMMDD + 4位顺序号)
 * @param tenantId 租户ID
 * @param tx 可选的数据库事务对象
 */
export async function generateTicketNo(tenantId: string, tx?: Transaction): Promise<string> {
    const executor = tx || db;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `AS${year}${month}${day}`;

    const [latest] = await executor.select({ ticketNo: afterSalesTickets.ticketNo })
        .from(afterSalesTickets)
        .where(and(
            eq(afterSalesTickets.tenantId, tenantId),
            sql`${afterSalesTickets.ticketNo} LIKE ${prefix + '%'}`
        ))
        .orderBy(desc(afterSalesTickets.ticketNo))
        .limit(1);

    if (latest && latest.ticketNo) {
        const currentSeq = parseInt(latest.ticketNo.slice(-4));
        const nextSeq = String(currentSeq + 1).padStart(4, '0');
        return `${prefix}${nextSeq}`;
    }

    return `${prefix}0001`;
}

/**
 * 生成定责单编号 (LN + YYYYMMDD + 4位顺序号)
 * @param tenantId 租户ID
 * @param tx 可选的数据库事务对象
 */
export async function generateNoticeNo(tenantId: string, tx?: Transaction): Promise<string> {
    const executor = tx || db;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `LN${year}${month}${day}`;

    const [latest] = await executor.select({ noticeNo: liabilityNotices.noticeNo })
        .from(liabilityNotices)
        .where(and(
            eq(liabilityNotices.tenantId, tenantId),
            sql`${liabilityNotices.noticeNo} LIKE ${prefix + '%'}`
        ))
        .orderBy(desc(liabilityNotices.noticeNo))
        .limit(1);

    if (latest && latest.noticeNo) {
        const currentSeq = parseInt(latest.noticeNo.slice(-4));
        const nextSeq = String(currentSeq + 1).padStart(4, '0');
        return `${prefix}${nextSeq}`;
    }

    return `${prefix}0001`;
}

/**
 * 对 LIKE 模式进行转义，防止 SQL 注入
 * 转义字符包括 %, _, \
 */
export function escapeLikePattern(input: string): string {
    return input.replace(/[%_\\]/g, '\\$&');
}

/**
 * 手机号脱敏处理
 * 规则：保留前3位和后4位，中间用4个*代替
 * 例：13812345678 -> 138****5678
 * 若长度不足7位，则不处理（或根据实际需求调整）
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';
    const s = String(phone);
    if (s.length < 7) return s;
    return s.substring(0, 3) + '****' + s.substring(s.length - 4);
}
