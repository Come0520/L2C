'use server';

import { splitRuleSchema, type SplitRuleInput } from './rules.schema';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { splitRouteRules, suppliers } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';
import { AuditService } from '@/shared/lib/audit-service';

import { requireAuth, requireManagePermission, requireViewPermission } from '../helpers';
import { SUPPLY_CHAIN_PATHS } from '../constants';



// 移除本地 requireUser，使用 helpers.ts 中的 requireAuth

/**
 * 获取当前租户的所有拆单规则清单
 * 
 * @description 按优先级降序排列规则。
 * @returns {Promise<SplitRouteRule[]>}
 */
export async function getSplitRules() {
  const authResult = await requireAuth();
  if (!authResult.success) throw new Error(authResult.error);
  const session = authResult.session;

  const permResult = await requireViewPermission(session); // 或 requireManagePermission? 原代码是 VIEW
  if (!permResult.success) throw new Error(permResult.error);

  console.warn('[supply-chain] getSplitRules 开始执行');
  const result = await db
    .select()
    .from(splitRouteRules)
    .where(eq(splitRouteRules.tenantId, session.user.tenantId))
    .orderBy(desc(splitRouteRules.priority));
  console.warn('[supply-chain] getSplitRules 执行成功:', { count: result.length });
  return result;
}

/**
 * 创建新的拆单规则
 * 
 * @description 包含 Zod 验证和审计日志。
 * @param input 符合 SplitRuleInput 结构的数据
 * @returns {Promise<{success: true}>}
 */
export async function createSplitRule(input: SplitRuleInput) {
  const authResult = await requireAuth();
  if (!authResult.success) throw new Error(authResult.error);
  const session = authResult.session;

  const permResult = await requireManagePermission(session);
  if (!permResult.success) throw new Error(permResult.error);

  const validated = splitRuleSchema.parse(input);
  console.warn('[supply-chain] createSplitRule 开始执行:', { name: validated.name, priority: validated.priority });

  await db.insert(splitRouteRules).values({
    tenantId: session.user.tenantId,
    createdBy: session.user.id,
    name: validated.name,
    priority: validated.priority,
    conditions: validated.conditions,
    targetType: validated.targetType,
    targetSupplierId: validated.targetSupplierId,
    isActive: validated.isActive,
  });

  // 记录审计日志
  await AuditService.recordFromSession(session, 'splitRouteRules', 'new', 'CREATE', {
    new: validated
  });

  revalidatePath(SUPPLY_CHAIN_PATHS.RULES);
  return { success: true };
}

/**
 * 更新指定的拆单规则
 * 
 * @description 包含租户归属权安全检查和审计日志。
 * @param id 规则 ID
 * @param input 待更新的规则数据
 * @returns {Promise<{success: true}>}
 */
export async function updateSplitRule(id: string, input: SplitRuleInput) {
  const authResult = await requireAuth();
  if (!authResult.success) throw new Error(authResult.error);
  const session = authResult.session;

  const permResult = await requireManagePermission(session);
  if (!permResult.success) throw new Error(permResult.error);

  const validated = splitRuleSchema.parse(input);
  console.warn('[supply-chain] updateSplitRule 开始执行:', { id, name: validated.name });

  // 安全检查：验证规则属于当前租户
  const existingRule = await db.query.splitRouteRules.findFirst({
    where: and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, session.user.tenantId)),
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
      isActive: validated.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, session.user.tenantId)));

  // 记录审计日志
  await AuditService.recordFromSession(session, 'splitRouteRules', id, 'UPDATE', {
    new: validated
  });

  revalidatePath(SUPPLY_CHAIN_PATHS.RULES);
  return { success: true };
}

/**
 * 删除指定的拆单规则
 * 
 * @description 包含租户归属权安全检查。
 * @param id 规则 ID
 * @returns {Promise<{success: true}>}
 */
export async function deleteSplitRule(id: string) {
  const authResult = await requireAuth();
  if (!authResult.success) throw new Error(authResult.error);
  const session = authResult.session;

  const permResult = await requireManagePermission(session);
  if (!permResult.success) throw new Error(permResult.error);

  // 安全检查：验证规则属于当前租户
  const existingRule = await db.query.splitRouteRules.findFirst({
    where: and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, session.user.tenantId)),
  });
  if (!existingRule) {
    throw new Error('规则不存在或无权操作');
  }

  await db
    .delete(splitRouteRules)
    .where(and(eq(splitRouteRules.id, id), eq(splitRouteRules.tenantId, session.user.tenantId)));

  // 记录审计日志
  await AuditService.recordFromSession(session, 'splitRouteRules', id, 'DELETE');

  revalidatePath(SUPPLY_CHAIN_PATHS.RULES);
  return { success: true };
}

/**
 * 获取租户下的所有供应商列表 (简单清单)
 * 
 * @description 用于在规则配置界面展示供应商下拉选择。
 * @returns {Promise<Array<{id: string, name: string, supplierNo: string}>>}
 */
export async function getAllSuppliers() {
  const authResult = await requireAuth();
  if (!authResult.success) throw new Error(authResult.error);
  const session = authResult.session;

  console.warn('[supply-chain] getAllSuppliers 开始执行');
  const result = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      supplierNo: suppliers.supplierNo,
    })
    .from(suppliers)
    .where(eq(suppliers.tenantId, session.user.tenantId));
  console.warn('[supply-chain] getAllSuppliers 执行成功:', { count: result.length });
  return result;
}
