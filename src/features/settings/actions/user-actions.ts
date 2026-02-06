'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateUser(userId: string, data: {
    name?: string;
    roles?: string[];
    isActive?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // Permission check: Only ADMIN or OWNER
    // Also user should be able to update themselves? Usually admins manage users.
    const currentUserRole = session.user.role;
    const currentUserRoles = session.user.roles || [];
    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRoles.includes('ADMIN');

    if (!isAdmin) {
        return { success: false, error: '无权限修改用户信息' };
    }

    try {
        await db.update(users)
            .set({
                name: data.name,
                roles: data.roles,
                // If roles has items, sync primary role to first item for backward compatibility
                role: data.roles && data.roles.length > 0 ? data.roles[0] : (data.roles ? 'STAFF' : undefined),
                isActive: data.isActive,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        revalidatePath('/settings/users');
        return { success: true };
    } catch (error) {
        console.error('Update user failed:', error);
        return { success: false, error: '更新失败' };
    }
}
