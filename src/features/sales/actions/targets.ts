'use server';

import { db } from '@/shared/api/db';
import { salesTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';

export interface SalesTargetDTO {
  userId: string;
  userName: string;
  userAvatar: string | null;
  targetId: string | null;
  targetAmount: number;
  updatedAt: Date | null;
}

export async function getSalesTargets(
  year: number,
  month: number
): Promise<{ success: boolean; data?: SalesTargetDTO[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

    // Select all SALES users and left join targets
    const result = await db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatarUrl,
        targetId: salesTargets.id,
        targetAmount: salesTargets.targetAmount,
        updatedAt: salesTargets.updatedAt,
      })
      .from(users)
      .leftJoin(
        salesTargets,
        and(
          eq(salesTargets.userId, users.id),
          eq(salesTargets.year, year),
          eq(salesTargets.month, month)
        )
      )
      .where(
        and(
          eq(users.tenantId, session.user.tenantId),
          eq(users.role, 'sales'),
          eq(users.isActive, true)
        )
      );

    const data: SalesTargetDTO[] = result.map((r) => ({
      userId: r.userId,
      userName: r.userName || 'Unknown',
      userAvatar: r.userAvatar,
      targetId: r.targetId,
      targetAmount: parseFloat(r.targetAmount as string) || 0,
      updatedAt: r.updatedAt,
    }));

    return { success: true, data };
  } catch (error) {
    logger.error('getSalesTargets error:', error);
    return { success: false, error: 'Failed to fetch targets' };
  }
}

export async function updateSalesTarget(
  userId: string,
  year: number,
  month: number,
  amount: number
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

    // Ensure user has permission (Manager/Admin)
    // In real app we check role permissions. Assuming simple check:
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      return { success: false, error: 'Permission denied' };
    }

    // Upsert
    await db
      .insert(salesTargets)
      .values({
        tenantId: session.user.tenantId,
        userId,
        year,
        month,
        targetAmount: String(amount),
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [salesTargets.tenantId, salesTargets.userId, salesTargets.year, salesTargets.month],
        set: {
          targetAmount: String(amount),
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      });

    revalidatePath('/settings/sales/targets');
    return { success: true };
  } catch (error) {
    logger.error('updateSalesTarget error:', error);
    return { success: false, error: 'Failed to update target' };
  }
}

export async function getMySalesTarget(year?: number, month?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const result = await db.query.salesTargets.findFirst({
      where: and(
        eq(salesTargets.tenantId, session.user.tenantId),
        eq(salesTargets.userId, session.user.id),
        eq(salesTargets.year, targetYear),
        eq(salesTargets.month, targetMonth)
      ),
      columns: { targetAmount: true },
    });

    // Also get actual sales (Cash)
    // Reuse logic from getSalesTargets or just query quotes
    // For simple widget, we might just need target amount and the widget calculates progress from other props?
    // Or widget loads its own data?
    // Let's assume widget fetches metric data.
    // But SalesTargetWidget usually needs "Target" and "Current Achievement".

    return {
      success: true,
      data: {
        targetAmount: parseFloat(result?.targetAmount as string) || 0,
      },
    };
  } catch (error) {
    logger.error('getMySalesTarget error:', error);
    return { success: false, error: 'Failed' };
  }
}
