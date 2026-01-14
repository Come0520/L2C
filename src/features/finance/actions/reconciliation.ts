'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { reconciliations } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * 获取对账单列表
 */
export async function getReconciliations() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    try {
        const results = await db.query.reconciliations.findMany({
            where: eq(reconciliations.tenantId, session.user.tenantId),
            orderBy: [desc(reconciliations.createdAt)],
            with: {
                // 如果有关联的话可以加上
            }
        });
        return results;
    } catch (error) {
        console.error('Failed to fetch reconciliations:', error);
        return [];
    }
}

/**
 * 获取单条对账单详情
 */
export async function getReconciliation(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return null;

    try {
        return await db.query.reconciliations.findFirst({
            where: and(
                eq(reconciliations.id, id),
                eq(reconciliations.tenantId, session.user.tenantId)
            ),
            with: {
                details: true,
            }
        });
    } catch (error) {
        console.error('Failed to fetch reconciliation:', error);
        return null;
    }
}
