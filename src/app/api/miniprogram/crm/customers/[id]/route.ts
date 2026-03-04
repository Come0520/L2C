import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, customerActivities } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import {
  apiSuccess,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('Unauthorized');
      }

      const { id: customerId } = await params;

      const customer = await db.query.customers.findFirst({
        where: and(eq(customers.id, customerId), eq(customers.tenantId, user.tenantId)),
        with: {
          assignedSales: {
            columns: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      if (!customer) {
        return apiNotFound('Customer not found');
      }

      // Get recent activities
      const recentActivities = await db.query.customerActivities.findMany({
        where: and(
          eq(customerActivities.customerId, customerId),
          eq(customerActivities.tenantId, user.tenantId)
        ),
        orderBy: [desc(customerActivities.createdAt)],
        limit: 5,
        with: {
          creator: {
            columns: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return apiSuccess({
        ...customer,
        activities: recentActivities,
      });
    } catch (error) {
      logger.error('Get Customer Detail Error:', error);
      return apiServerError('Internal Error');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
