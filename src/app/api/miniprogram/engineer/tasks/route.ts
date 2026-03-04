/**
 * 工程师任务列表 API
 *
 * GET /api/miniprogram/engineer/tasks
 * 返回当前登录工程师（安装师傅）名下的所有安装/测量任务，
 * 按预约日期倒序排列，关联查询任务明细项。
 * 支持 ?status=pending|in_progress|completed 过滤。
 *
 * @cache 短期内存缓存 30 秒，Key 格式: `miniprogram:engineer:tasks:{tenantId}:{userId}:{status}`
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { CacheService } from '@/shared/services/miniprogram/cache.service';

/** UUID v4 格式校验 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 前端 status 参数 → 数据库 installTaskStatusEnum 值映射
 * pending   → 待派单 / 待接单状态
 * in_progress → 进行中状态
 * completed → 已完成状态
 */
const STATUS_MAP: Record<string, string[]> = {
  pending: ['PENDING_DISPATCH', 'PENDING_ACCEPT'],
  in_progress: ['ACCEPTED', 'IN_PROGRESS', 'PAUSED'],
  completed: ['COMPLETED', 'CONFIRMED'],
};

/**
 * 获取当前工程师的任务列表
 *
 * @route GET /api/miniprogram/engineer/tasks
 * @query status - 可选，pending | in_progress | completed
 * @auth 需要小程序登录（Bearer Token），仅返回工程师本人名下的任务
 * @returns 按预约日期、创建时间倒序排列的任务数组，含任务明细项
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    // 开发环境虚拟用户使用非 UUID 格式 ID，返回空数组
    if (!UUID_RE.test(user.id) || !UUID_RE.test(user.tenantId)) {
      logger.info('[Engineer] 开发环境虚拟用户，返回空任务列表', { userId: user.id });
      return apiSuccess([]);
    }

    // 解析 status 查询参数
    const statusParam = request.nextUrl.searchParams.get('status');
    const dbStatuses = statusParam ? STATUS_MAP[statusParam] : undefined;

    // 缓存 Key 含 status 参数，不同 Tab 独立缓存
    const cacheKey = `miniprogram:engineer:tasks:${user.tenantId}:${user.id}:${statusParam || 'all'}`;

    const list = await CacheService.getOrSet(
      cacheKey,
      async () => {
        // 构建查询条件
        const conditions = [
          eq(installTasks.tenantId, user.tenantId),
          eq(installTasks.installerId, user.id),
        ];

        // 如果指定了状态过滤
        if (dbStatuses && dbStatuses.length > 0) {
          conditions.push(inArray(installTasks.status, dbStatuses as any));
        }

        return db.query.installTasks.findMany({
          where: and(...conditions),
          orderBy: [desc(installTasks.scheduledDate), desc(installTasks.createdAt)],
          with: {
            items: true,
          },
        });
      },
      30000
    ); // 30 秒短期缓存

    return apiSuccess(list);
  } catch (error) {
    logger.error('[Engineer] 获取任务列表失败', { route: 'engineer/tasks', error });
    return apiError('获取任务列表失败', 500);
  }
}
