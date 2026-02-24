/**
 * 工程师任务列表 API
 *
 * GET /api/miniprogram/engineer/tasks
 * 返回当前登录工程师（安装师傅）名下的所有安装/测量任务，
 * 按预约日期倒序排列，关联查询任务明细项。
 *
 * @cache 短期内存缓存 30 秒，Key 格式: `miniprogram:engineer:tasks:{tenantId}:{userId}`
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { CacheService } from '@/shared/services/miniprogram/cache.service';

/**
 * 获取当前工程师的任务列表
 *
 * @route GET /api/miniprogram/engineer/tasks
 * @auth 需要小程序登录（Bearer Token），仅返回工程师本人名下的任务
 * @returns 按预约日期、创建时间倒序排列的任务数组，含任务明细项
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        // 缓存策略：工程师频繁刷新任务列表，30 秒短缓存平衡实时性
        const cacheKey = `miniprogram:engineer:tasks:${user.tenantId}:${user.id}`;

        const list = await CacheService.getOrSet(cacheKey, async () => {
            return db.query.installTasks.findMany({
                where: and(
                    eq(installTasks.tenantId, user.tenantId),
                    eq(installTasks.installerId, user.id)
                ),
                orderBy: [desc(installTasks.scheduledDate), desc(installTasks.createdAt)],
                with: {
                    items: true
                }
            });
        }, 30000); // 30 秒短期缓存

        return apiSuccess(list);

    } catch (error) {
        logger.error('[Engineer] 获取任务列表失败', { route: 'engineer/tasks', error });
        return apiError('获取任务列表失败', 500);
    }
}
