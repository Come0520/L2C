import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import {
  apiSuccess,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../auth-utils';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('Unauthorized');
      }

      const { id: orderId } = await params;

      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, orderId), eq(orders.tenantId, user.tenantId)),
        with: {
          items: true, // Fetch items
          paymentSchedules: {
            orderBy: [asc(paymentSchedules.createdAt)],
          },
        },
      });

      if (!order) {
        return apiNotFound('Order not found');
      }

      return apiSuccess(order);
    } catch (error) {
      logger.error('Get Order Detail Error:', error);
      return apiServerError('Internal Error');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN', 'CUSTOMER']
);
