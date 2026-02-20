'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { ilike, and, eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

/**
 * 搜索租户内的可用审批人
 * 
 * 用于在动态加签或配置审批节点时，根据名称模糊搜索活跃用户。
 * 包含输入净化以防止 SQL 注入或意外匹配，最多返回 10 条结果。
 * 
 * @param query - 搜索关键字（模糊匹配用户名称）
 * @returns 匹配的活跃用户列表，包含 id, name, role
 */
export async function searchApprovers(query: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    // 输入净化：限制长度并转义通配符
    const sanitized = query.slice(0, 50).replace(/[%_\\]/g, '\\$&');

    return await db.query.users.findMany({
        where: and(
            eq(users.tenantId, session.user.tenantId),
            eq(users.isActive, true),
            ilike(users.name, `%${sanitized}%`)
        ),
        columns: {
            id: true,
            name: true,
            role: true
        },
        limit: 10
    });
}
