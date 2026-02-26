import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { desc } from 'drizzle-orm';
import { format } from 'date-fns';

export async function generateOrderNo(tenantId: string): Promise<string> {
    const prefix = `ORD-${format(new Date(), 'yyyyMMdd')}`;

    // Find last order for today
    const lastOrder = await db.query.orders.findFirst({
        where: (o, { and, eq, like }) => and(
            eq(o.tenantId, tenantId),
            like(o.orderNo, `${prefix}%`)
        ),
        orderBy: [desc(orders.orderNo)]
    });

    let sequence = 1;

    if (lastOrder) {
        const parts = lastOrder.orderNo.split('-');
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2], 10);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }
    }

    // Pad sequence to 4 digits
    const seqStr = sequence.toString().padStart(4, '0');
    return `${prefix}-${seqStr}`;
}

/**
 * 生成通用编号
 * @param prefix 前缀，如 'TKT', 'INV' 等
 * @returns 格式: PREFIX-yyyyMMddHHmmss-XXXX
 */
export function generateNo(prefix: string): string {
    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
