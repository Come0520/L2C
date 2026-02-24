/**
 * 租户资源配额管理器 (Quota Manager)
 * 
 * 为多租户系统提供资源配额控制，防止资源滥用。
 */

import { db } from '@/shared/api/db';
import { roles, users } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';

export class QuotaManager {
    /**
     * 默认配额配置
     * 实际项目中建议从数据库或缓存读取租户对应的套餐配置
     */
    private static DEFAULT_QUOTAS = {
        roles: 20,    // 每个租户最多 20 个角色
        workers: 100, // 每个租户最多 100 个师傅
    };

    /**
     * 检查角色配额
     * @throws 如果超过硬限制则抛出错误
     */
    static async checkRoleQuota(tenantId: string): Promise<void> {
        const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(roles)
            .where(eq(roles.tenantId, tenantId));

        const count = Number(result?.count || 0);
        const limit = this.DEFAULT_QUOTAS.roles;

        if (count >= limit) {
            logger.warn(`[QuotaManager] 租户 ${tenantId} 角色配额已满: ${count}/${limit}`);
            throw new Error(`角色数量已达上限 (${limit})，请联系管理员升级套餐`);
        }

        if (count >= limit * 0.8) {
            logger.info(`[QuotaManager] 租户 ${tenantId} 角色配额即将用尽: ${count}/${limit}`);
        }
    }

    /**
     * 检查师傅配额 (预留)
     */
    static async checkWorkerQuota(tenantId: string): Promise<void> {
        const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(and(
                eq(users.tenantId, tenantId),
                eq(users.role, 'WORKER')
            ));

        const count = Number(result?.count || 0);
        const limit = this.DEFAULT_QUOTAS.workers;

        if (count >= limit) {
            logger.warn(`[QuotaManager] 租户 ${tenantId} 师傅配额已满: ${count}/${limit}`);
            throw new Error(`师傅数量已达上限 (${limit})，请联系管理员升级套餐`);
        }
    }
}
