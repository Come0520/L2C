import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customerActivities } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../auth-utils';



export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customerId');

        if (!customerId) {
            return apiError('Customer ID required', 400);
        }

        const list = await db.query.customerActivities.findMany({
            where: and(
                eq(customerActivities.customerId, customerId),
                eq(customerActivities.tenantId, user.tenantId)
            ),
            orderBy: [desc(customerActivities.createdAt)],
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        return apiSuccess(list);

    } catch (error) {
        console.error('Get Activities Error:', error);
        return apiError('Internal Error', 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const body = await request.json();
        const { customerId, type, description, images, location } = body;

        if (!customerId || !type || !description) {
            return apiError('Missing required fields', 400);
        }

        const [newActivity] = await db.insert(customerActivities).values({
            tenantId: user.tenantId,
            customerId,
            type,
            description,
            images: images || [],
            location: location || null,
            createdBy: user.id
        }).returning();

        return apiSuccess(newActivity);

    } catch (error) {
        console.error('Create Activity Error:', error);
        return apiError('Internal Error', 500);
    }
}
