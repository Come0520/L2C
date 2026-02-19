/**
 * 租户上下文工具
 * 
 * 用于在数据库查询前设置当前租户 ID，配合 RLS 使用
 */
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * 设置当前请求的租户上下文
 * 必须在每次查询前调用，用于 RLS 策略判断
 * 
 * @param tenantId - 租户 UUID
 */
export async function setTenantContext(tenantId: string): Promise<void> {
    if (!tenantId) {
        throw new Error('tenantId 不能为空');
    }

    // 安全措施：严格验证 UUID 格式，防止 SQL 注入
    // 由于 PostgreSQL SET LOCAL 不支持参数化查询，UUID 格式验证是必要的安全屏障
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
        throw new Error('tenantId 必须是有效的 UUID 格式');
    }

    // 安全说明：此处使用 sql.raw 是因为 SET LOCAL 不支持参数化
    // 安全性由上方的 UUID 严格格式验证保证
    await db.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${tenantId}'`));
}

/**
 * 在事务中执行带租户上下文的操作
 * 
 * @param tenantId - 租户 UUID
 * @param callback - 在租户上下文中执行的回调
 * @returns 回调的返回值
 * 
 * @example
 * ```typescript
 * const orders = await withTenantContext(session.user.tenantId, async () => {
 *     return await db.query.orders.findMany();
 * });
 * ```
 */
export async function withTenantContext<T>(
    tenantId: string,
    callback: () => Promise<T>
): Promise<T> {
    if (!tenantId) {
        throw new Error('tenantId 不能为空');
    }

    // 安全措施：严格验证 UUID 格式，防止 SQL 注入
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
        throw new Error('tenantId 必须是有效的 UUID 格式');
    }

    return await db.transaction(async (tx) => {
        // 安全说明：SET LOCAL 不支持参数化查询，需靠正则保证输入安全
        await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${tenantId}'`));

        // 执行业务逻辑
        return await callback();
    });
}

/**
 * 清除租户上下文 (用于测试或特殊场景)
 */
export async function clearTenantContext(): Promise<void> {
    await db.execute(sql.raw(`RESET app.current_tenant_id`));
}
