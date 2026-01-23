import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { sql } from 'drizzle-orm';

/**
 * 生成测量单号
 * 格式: M + YYYYMMDD + 4位序号
 * 例如: M202601220001
 */
export async function generateMeasureNo(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `M${year}${month}${day}`;

    // 查询当天最大的单号
    const [latestTask] = await db.select({ measureNo: measureTasks.measureNo })
        .from(measureTasks)
        .where(sql`${measureTasks.measureNo} LIKE ${prefix + '%'}`)
        .orderBy(sql`${measureTasks.measureNo} DESC`)
        .limit(1);

    if (latestTask && latestTask.measureNo) {
        const currentSeq = parseInt(latestTask.measureNo.slice(-4));
        const nextSeq = String(currentSeq + 1).padStart(4, '0');
        return `${prefix}${nextSeq}`;
    }

    return `${prefix}0001`;
}
