'use server';

/**
 * 敏感信息查看 Actions
 * 记录敏感信息的查看日志
 */

import { db } from '@/shared/api/db';
import { phoneViewLogs } from '@/shared/api/schema/customers';
import { revalidatePath } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

export interface ViewPhoneLogInput {
    customerId: string;
    ipAddress?: string;
}

/**
 * 记录手机号查看日志
 * 
 * 安全检查：自动从 session 获取操作人信息和 tenantId
 */
export async function logPhoneView(input: ViewPhoneLogInput) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.CUSTOMER.VIEW);

    const { customerId, ipAddress } = input;
    const tenantId = session.user.tenantId;
    const viewerId = session.user.id;
    // 假设 session 中有 role 信息，或者我们只记录 ID。Schema 如果需要 role，我们可以从 session 或数据库获取。
    // 这里简化处理，role 可以是可选的，或者如果 session 有就存入。
    // 检查 session 类型定义，通常包含 role。
    const viewerRole = (session.user as { role?: string }).role || 'USER';

    await db.insert(phoneViewLogs).values({
        tenantId,
        customerId,
        viewerId,
        viewerRole,
        ipAddress: ipAddress || null,
    });

    revalidatePath(`/customers/${customerId}`);
}

/**
 * 获取客户的手机号查看日志
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getPhoneViewLogs(customerId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.CUSTOMER.VIEW);

    const tenantId = session.user.tenantId;

    const logs = await db.query.phoneViewLogs.findMany({
        where: (t, { eq, and }) => and(
            eq(t.customerId, customerId),
            eq(t.tenantId, tenantId)
        ),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: 50,
    });

    return logs;
}
