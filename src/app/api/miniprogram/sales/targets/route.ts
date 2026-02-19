
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { salesTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { apiSuccess, apiError } from '@/shared/lib/api-response';



/**
 * GET /api/miniprogram/sales/targets
 * Query Params:
 * - year: number (default current)
 * - month: number (default current)
 * - userId: string (optional, filter by user)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user) return apiError('Unauthorized', 401);

        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
        const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1));
        const targetUserId = searchParams.get('userId');

        // Permission check
        // If SALES, can only see own targets? Or maybe team if allowed. usually own.
        // If MANAGER/ADMIN, can see all.
        let filterUserId = targetUserId;
        if (user.role === 'sales' && (!targetUserId || targetUserId !== user.id)) {
            // Sales restricted to own data unless explicit policy says otherwise.
            // For simplicity, enforce own data view for now.
            filterUserId = user.id;
        }

        // Query targets
        // We might want to join with users to get names if listing for manager
        // But for list view, we usually fetch users list and map targets.
        // Let's just return targets found.

        const conditions = [
            eq(salesTargets.tenantId, user.tenantId),
            eq(salesTargets.year, year),
            eq(salesTargets.month, month)
        ];

        if (filterUserId) {
            conditions.push(eq(salesTargets.userId, filterUserId));
        }

        // Better approach: Select from Users, left join Targets
        const result = await db.select({
            userId: users.id,
            userName: users.name,
            userAvatar: users.avatarUrl,
            targetId: salesTargets.id,
            targetAmount: salesTargets.targetAmount,
            updatedAt: salesTargets.updatedAt
        })
            .from(users)
            .leftJoin(salesTargets, and(
                eq(salesTargets.userId, users.id),
                eq(salesTargets.year, year),
                eq(salesTargets.month, month)
            ))
            .where(and(
                eq(users.tenantId, user.tenantId),
                eq(users.role, 'sales'),
                eq(users.isActive, true)
            ));

        const formatted = result.map(r => ({
            id: r.targetId, // can be null
            userId: r.userId,
            userName: r.userName,
            userAvatar: r.userAvatar,
            year,
            month,
            targetAmount: r.targetAmount || '0',
            updatedAt: r.updatedAt
        }));

        return apiSuccess(formatted);

    } catch (error) {
        console.error('Get Targets Error:', error);
        return apiError('Failed to fetch targets', 500);
    }
}

/**
 * POST /api/miniprogram/sales/targets
 * Body: { userId, year, month, targetAmount }
 * Role: MANAGER, ADMIN
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user) return apiError('Unauthorized', 401);

        if (!['admin', 'manager', 'BOSS'].includes(user.role?.toLowerCase() || '')) {
            return apiError('Permission denied', 403);
        }

        const body = await request.json();
        const { userId, year, month, targetAmount } = body;

        if (!userId || !year || !month || targetAmount === undefined) {
            return apiError('Missing required fields', 400);
        }

        // Upsert logic
        // Drizzle's onConflictDoUpdate
        await db.insert(salesTargets)
            .values({
                tenantId: user.tenantId,
                userId,
                year,
                month,
                targetAmount: String(targetAmount),
                updatedBy: user.id
            })
            .onConflictDoUpdate({
                target: [salesTargets.tenantId, salesTargets.userId, salesTargets.year, salesTargets.month], // limit based on unique index
                set: {
                    targetAmount: String(targetAmount),
                    updatedAt: new Date(),
                    updatedBy: user.id
                }
            });

        return apiSuccess(null);

    } catch (error) {
        console.error('Set Target Error:', error);
        return apiError('Failed to set target', 500);
    }
}
