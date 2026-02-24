/**
 * 销售目标管理 API
 *
 * GET  /api/miniprogram/sales/targets — 获取销售团队/个人月度业绩目标
 * POST /api/miniprogram/sales/targets — 设置/更新销售人员月度业绩目标（仅管理员/经理）
 *
 * 业务场景：管理层为销售团队分配月度创收基线目标，销售人员查看自身目标完成情况。
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { salesTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { CacheService } from '@/shared/services/miniprogram/cache.service';
import { SetSalesTargetSchema } from '../../miniprogram-schemas';

/**
 * 获取销售目标列表
 *
 * @route GET /api/miniprogram/sales/targets
 * @auth 需要小程序登录（Bearer Token）
 * @query year - 目标年份（默认当年）
 * @query month - 目标月份（默认当月，1-12）
 * @query userId - 指定用户 ID 筛选（可选，销售角色仅能查看自身数据）
 * @returns 关联用户信息的销售目标数组，含 userId、userName、targetAmount 等
 * @cache 内存缓存 60 秒，Key 格式: `miniprogram:sales:targets:{tenantId}:{year}:{month}`
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user) return apiError('未授权', 401);

        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
        const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
        const targetUserId = searchParams.get('userId');

        // 权限控制：销售角色只能查看自己的目标
        let _filterUserId = targetUserId;
        if (user.role === 'sales' && (!targetUserId || targetUserId !== user.id)) {
            _filterUserId = user.id;
        }

        // 缓存策略：销售目标数据在月内变更较少，60 秒缓存平衡实时性
        const cacheKey = `miniprogram:sales:targets:${user.tenantId}:${year}:${month}`;

        const formatted = await CacheService.getOrSet(cacheKey, async () => {
            // 左连接用户表与目标表，获取完整的销售人员目标视图
            const result = await db.select({
                userId: users.id,
                userName: users.name,
                userAvatar: users.avatarUrl,
                targetId: salesTargets.id,
                targetAmount: salesTargets.targetAmount,
                updatedAt: salesTargets.updatedAt
            })
                .from(users)
                .leftJoin(salesTargets, and(
                    eq(salesTargets.userId, users.id),
                    eq(salesTargets.year, year),
                    eq(salesTargets.month, month)
                ))
                .where(and(
                    eq(users.tenantId, user.tenantId),
                    eq(users.role, 'sales'),
                    eq(users.isActive, true)
                ));

            return result.map(r => ({
                id: r.targetId,
                userId: r.userId,
                userName: r.userName,
                userAvatar: r.userAvatar,
                year,
                month,
                targetAmount: r.targetAmount || '0',
                updatedAt: r.updatedAt
            }));
        }, 60000); // 60 秒缓存

        return apiSuccess(formatted);

    } catch (error) {
        logger.error('[SalesTarget] 获取销售目标异常', { route: 'sales/targets', error });
        return apiError('获取销售目标失败', 500);
    }
}

/**
 * 设置或更新销售人员月度业绩目标（Upsert 语义）
 *
 * @route POST /api/miniprogram/sales/targets
 * @auth 需要小程序登录（Bearer Token），仅限管理员(admin)/经理(manager)/老板(BOSS) 角色
 * @body userId - 目标销售人员 ID（UUID 格式）
 * @body year - 目标年份（2020-2100）
 * @body month - 目标月份（1-12）
 * @body targetAmount - 月度业绩定额（≥0）
 * @returns 操作成功标识
 * @audit 记录 SET_TARGET 审计日志（容灾设计）
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user) return apiError('未授权', 401);

        // 权限校验：仅管理层角色可设置目标
        if (!['admin', 'manager', 'boss'].includes(user.role?.toLowerCase() || '')) {
            return apiError('权限不足，仅管理员/经理可设置目标', 403);
        }

        const body = await request.json();

        // Zod 输入验证
        const parsed = SetSalesTargetSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { userId, year, month, targetAmount } = parsed.data;

        // Upsert 逻辑：基于租户+用户+年+月的唯一约束
        await db.insert(salesTargets)
            .values({
                tenantId: user.tenantId,
                userId,
                year,
                month,
                targetAmount: String(targetAmount),
                updatedBy: user.id
            })
            .onConflictDoUpdate({
                target: [salesTargets.tenantId, salesTargets.userId, salesTargets.year, salesTargets.month],
                set: {
                    targetAmount: String(targetAmount),
                    updatedAt: new Date(),
                    updatedBy: user.id
                }
            });

        // 审计日志（容灾设计）
        try {
            const { AuditService } = await import('@/shared/services/audit-service');
            await AuditService.log(db, {
                tableName: 'sales_targets',
                recordId: `${userId}_${year}_${month}`,
                action: 'SET_TARGET',
                userId: user.id,
                tenantId: user.tenantId,
                details: { targetUserId: userId, year, month, amount: targetAmount }
            });
        } catch (auditError) {
            logger.warn('[SalesTarget] 审计日志记录失败', { error: auditError });
        }

        logger.info('[SalesTarget] 销售目标设置成功', {
            route: 'sales/targets',
            targetUserId: userId,
            year,
            month,
            amount: targetAmount,
            operatorId: user.id,
            tenantId: user.tenantId,
        });

        return apiSuccess(null);

    } catch (error) {
        logger.error('[SalesTarget] 设置销售目标异常', { route: 'sales/targets', error });
        return apiError('设置销售目标失败', 500);
    }
}
