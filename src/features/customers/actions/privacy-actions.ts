'use server';

/**
 * 敏感信息查看 Actions
 * 记录敏感信息的查看日志
 */

import { db } from '@/shared/api/db';
import { phoneViewLogs } from '@/shared/api/schema/customers';
import { revalidatePath } from 'next/cache';

export interface ViewPhoneLogInput {
    customerId: string;
    viewerId: string;
    viewerRole: string;
    ipAddress?: string;
    tenantId: string;
}

/**
 * 记录手机号查看日志
 */
export async function logPhoneView(input: ViewPhoneLogInput) {
    const { customerId, viewerId, viewerRole, ipAddress, tenantId } = input;

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
 */
export async function getPhoneViewLogs(customerId: string, tenantId: string) {
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
