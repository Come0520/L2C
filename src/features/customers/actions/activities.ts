'use server';

import { db } from '@/shared/api/db';
import { customerActivities, users } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

export interface ActivityDTO {
    id: string;
    type: string;
    description: string;
    createdAt: Date;
    creator: {
        id: string;
        name: string;
        avatarUrl: string | null;
    };
    location?: any;
    images?: string[];
}

export async function getActivities(customerId: string): Promise<{ success: boolean; data?: ActivityDTO[]; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        const list = await db.query.customerActivities.findMany({
            where: and(
                eq(customerActivities.customerId, customerId),
                eq(customerActivities.tenantId, session.user.tenantId)
            ),
            orderBy: [desc(customerActivities.createdAt)],
            with: {
                creator: {
                    columns: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        // Type checking/mapping if necessary, but drizzle returns inferred types close enough
        return { success: true, data: list as any };

    } catch (error) {
        console.error('getActivities error:', error);
        return { success: false, error: 'Failed to fetch activities' };
    }
}

export async function createActivity(data: {
    customerId: string;
    type: string;
    description: string;
    images?: string[];
    location?: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        const [newActivity] = await db.insert(customerActivities).values({
            tenantId: session.user.tenantId,
            customerId: data.customerId,
            type: data.type,
            description: data.description,
            images: data.images || [],
            location: data.location || null,
            createdBy: session.user.id
        }).returning();

        revalidatePath(`/customers/${data.customerId}`);
        return { success: true, data: newActivity };

    } catch (error) {
        console.error('createActivity error:', error);
        return { success: false, error: 'Failed to create activity' };
    }
}
