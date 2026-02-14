'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { splitRouteRules, suppliers } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

import { splitRuleSchema, type SplitRuleInput } from './rules.schema';
export type { SplitRuleInput };

async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('未授权');
  }
  return session.user;
}

export async function getSplitRules() {
  const user = await requireUser();

  // 权限检查
  const session = await auth();
  if (session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.VIEW);
  }

  return await db
    .select()
    .from(splitRouteRules)
    .where(eq(splitRouteRules.tenantId, user.tenantId))
    .orderBy(desc(splitRouteRules.priority));
}

export async function createSplitRule(input: SplitRuleInput) {
  const user = await requireUser();

  // 权限检查
  const session = await auth();
  if (session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  }

  const validated = splitRuleSchema.parse(input);

  await db.insert(splitRouteRules).values({
    tenantId: user.tenantId,
    createdBy: user.id,
    name: validated.name,
    priority: validated.priority,
    conditions: validated.conditions,
    targetType: validated.targetType,
    targetSupplierId: validated.targetSupplierId,
    isActive: validated.isActive === 1, // 转换为 boolean
  });

  revalidatePath('/supply-chain/rules');
  return { success: true };
}

export async function updateSplitRule(id: string, input: SplitRuleInput) {
  const user = await requireUser();

  // 权限检查
  const session = await auth();
  if (session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  }

  const validated = splitRuleSchema.parse(input);

  // 安全检查：验证规则属于当前租户
  const existingRule = await db.query.splitRouteRules.findFirst({
    where: and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, user.tenantId)),
  });
  if (!existingRule) {
    throw new Error('规则不存在或无权操作');
  }

  await db
    .update(splitRouteRules)
    .set({
      name: validated.name,
      priority: validated.priority,
      conditions: validated.conditions,
      targetType: validated.targetType,
      targetSupplierId: validated.targetSupplierId,
      isActive: validated.isActive === 1, // 转换为 boolean
      updatedAt: new Date(),
    })
    .where(and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, user.tenantId)));

  revalidatePath('/supply-chain/rules');
  return { success: true };
}

export async function deleteSplitRule(id: string) {
  const user = await requireUser();

  // 权限检查
  const session = await auth();
  if (session) {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  }

  // 安全检查：验证规则属于当前租户
  const existingRule = await db.query.splitRouteRules.findFirst({
    where: and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, user.tenantId)),
  });
  if (!existingRule) {
    throw new Error('规则不存在或无权操作');
  }

  await db
    .delete(splitRouteRules)
    .where(and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, user.tenantId)));

  revalidatePath('/supply-chain/rules');
  return { success: true };
}

export async function getAllSuppliers() {
  const user = await requireUser();

  return await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      supplierNo: suppliers.supplierNo,
    })
    .from(suppliers)
    .where(eq(suppliers.tenantId, user.tenantId));
}
