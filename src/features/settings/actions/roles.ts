'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { roles } from '@/shared/api/schema';
import { eq, asc } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';

export type RoleOption = {
  label: string;
  value: string;
  description?: string;
  isSystem: boolean;
};

import { DEFAULT_ROLES } from '../constants/roles';

export async function getAvailableRoles(): Promise<RoleOption[]> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return [];
  }

  try {
    const dbRoles = await db.query.roles.findMany({
      where: eq(roles.tenantId, session.user.tenantId),
      orderBy: [asc(roles.code)],
    });

    if (dbRoles.length === 0) {
      const newRoles = DEFAULT_ROLES.map((role) => ({
        tenantId: session.user.tenantId,
        name: role.name,
        code: role.code,
        description: role.description,
        isSystem: role.isSystem,
      }));

      // Insert default roles
      await db.insert(roles).values(newRoles);

      // Fetch again to get IDs and correct types
      const initializedRoles = await db.query.roles.findMany({
        where: eq(roles.tenantId, session.user.tenantId),
        orderBy: [asc(roles.code)],
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
    logger.error('Failed to fetch roles:', error);
    return [];
  }
}
