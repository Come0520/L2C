'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { ilike, and, eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

/**
 * 搜索租户内的可用审批人
 */
export async function searchApprovers(query: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    return await db.query.users.findMany({
        where: and(
            eq(users.tenantId, session.user.tenantId),
            ilike(users.name, `%${query}%`)
        ),
        columns: {
            id: true,
            name: true,
            role: true
        },
        limit: 10
    });
}
