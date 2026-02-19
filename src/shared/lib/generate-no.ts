import { nanoid } from 'nanoid';

/**
 * 生成唯一业务编号
 * 格式：PREFIX-YYYYMMDD-XXXXXX
 * 例如：PAY-20240320-AB12CD
 */
export function generateBusinessNo(prefix: string): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = nanoid(6).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
}
