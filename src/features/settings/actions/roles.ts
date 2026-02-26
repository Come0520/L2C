'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { roles } from '@/shared/api/schema';
import { eq, asc } from 'drizzle-orm';
import { ROLES } from '@/shared/config/roles';
import { logger } from '@/shared/lib/logger';

export type RoleOption = {
  label: string;
  value: string;
  description?: string;
  isSystem: boolean;
};

export async function getAvailableRoles(): Promise<RoleOption[]> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return [];
  }

  try {
    const dbRoles = await db.query.roles.findMany({
      where: eq(roles.tenantId, session.user.tenantId),
      orderBy: [asc(roles.code)],
      limit: 500, // [P2防御]
    });

    if (dbRoles.length === 0) {
      // Auto-initialize default roles for the tenant
      logger.info(`Initializing default roles for tenant: ${session.user.tenantId}`);

      const newRoles = Object.values(ROLES).map((role) => ({
        tenantId: session.user.tenantId,
        name: role.name,
        code: role.code,
        description: role.description,
        permissions: role.permissions, // Include permissions for completeness, though schema defaults might vary
        isSystem: role.isSystem,
      }));

      // Insert default roles (使用 onConflictDoNothing 防止并发初始化竞态)
      await db.insert(roles).values(newRoles).onConflictDoNothing();

      // Fetch again to get IDs and correct types
      const initializedRoles = await db.query.roles.findMany({
        where: eq(roles.tenantId, session.user.tenantId),
        orderBy: [asc(roles.code)],
        limit: 500, // [P2防御]
      });

      return initializedRoles.map((r) => ({
        label: `${r.name} (${r.code})`,
        value: r.code,
        description: r.description || '',
        isSystem: r.isSystem || false,
      }));
    }

    return dbRoles.map((r) => ({
      label: `${r.name} (${r.code})`,
      value: r.code,
      description: r.description || '',
      isSystem: r.isSystem || false,
    }));
  } catch (error) {
    logger.warn('获取可用角色失败:', error);
    return [];
  }
}
