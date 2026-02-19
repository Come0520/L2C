import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, customerActivities } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../../auth-utils';



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const { id: customerId } = await params;

        const customer = await db.query.customers.findFirst({
            where: and(eq(customers.id, customerId), eq(customers.tenantId, user.tenantId)),
            with: {
                assignedSales: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        if (!customer) {
            return apiError('Customer not found', 404);
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
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return apiSuccess({
            ...customer,
            activities: recentActivities
        });

    } catch (error) {
        console.error('Get Customer Detail Error:', error);
        return apiError('Internal Error', 500);
    }
}
