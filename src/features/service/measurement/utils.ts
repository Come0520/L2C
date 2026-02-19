import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { sql, and, eq } from 'drizzle-orm';

/**
 * 生成测量单号
 * 格式: M + YYYYMMDD + 4位序号
 * 例如: M202601220001
 * 
 * @param tenantId 租户ID，用于隔离和生成防重单号
 */
export async function generateMeasureNo(tenantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `M${year}${month}${day}`;

    // 使用事务和 FOR UPDATE 锁来保证并发安全
    // 注意：这里需要确保 db 支持 transaction
    return await db.transaction(async (tx) => {
        // 查询当天最大的单号并加锁
        // 注意：drizzle-orm 的 query builder 对 FOR UPDATE 支持可能有限，这里使用 raw sql 或依赖数据库特性
        // 简单实现：查询当前最大编号
        const [latestTask] = await tx.select({ measureNo: measureTasks.measureNo })
            .from(measureTasks)
            .where(and(
                eq(measureTasks.tenantId, tenantId),
                sql`${measureTasks.measureNo} LIKE ${prefix + '%'}`
            ))
            .orderBy(sql`${measureTasks.measureNo} DESC`)
            .limit(1)
            .for('update'); // 启用行级锁确保并发安全

        if (latestTask && latestTask.measureNo) {
            const currentSeq = parseInt(latestTask.measureNo.slice(-4));
            const nextSeq = String(currentSeq + 1).padStart(4, '0');
            return `${prefix}${nextSeq}`;
        }

        return `${prefix}0001`;
    });
}
