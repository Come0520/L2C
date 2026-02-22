import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { installTasks } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';



export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        // Fetch tasks assigned to this user (installer)
        const list = await db.query.installTasks.findMany({
            where: and(
                eq(installTasks.tenantId, user.tenantId),
                eq(installTasks.installerId, user.id)
            ),
            orderBy: [desc(installTasks.scheduledDate), desc(installTasks.createdAt)],
            with: {
                items: true
            }
        });

        return apiSuccess(list);

    } catch (error) {
        logger.error('Get Tasks Error:', error);
        return apiError('Internal Error', 500);
    }
}
