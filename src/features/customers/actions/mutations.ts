'use server';

import { db } from '@/shared/api/db';
import { customers, customerAddresses } from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { customerSchema, updateCustomerSchema, mergeCustomersSchema } from '../schemas';
import { revalidateTag } from 'next/cache';
import { CustomerService } from '@/services/customer.service';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { trimInput } from '@/shared/lib/utils';

import { logger } from '@/shared/lib/logger';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';

// Zod schemas for Addresses (define here or import if centralized)
const addressSchema = z.object({
  label: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  community: z.string().optional(),
  address: z.string().min(1, '地址不能为空'),
  isDefault: z.boolean().default(false),
});

const createAddressSchema = addressSchema.extend({
  customerId: z.string(),
});

const updateAddressSchema = addressSchema.partial().extend({
  id: z.string(),
  version: z.number().int().optional(),
});

/**
 * 创建新客户
 * 
 * @param input - 客户表单数据
 * @returns 新创建的客户信息
 */
export async function createCustomer(
  input: z.input<typeof customerSchema>
) {
  const data = trimInput(customerSchema.parse(input));

  // [Fix 5.3] 统一认证模式：从 session 获取 userId 和 tenantId
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // 权限检查：需要客户创建权限
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.CREATE)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  const userId = session.user.id;
  const tenantId = session.user.tenantId;

  logger.info('[customers] 创建客户:', { input, userId, tenantId });

  try {
    const result = await CustomerService.createCustomer(
      {
        name: data.name,
        phone: data.phone,
        phoneSecondary: data.phoneSecondary ?? null,
        wechat: data.wechat ?? null,
        gender: data.gender ?? null,
        level: data.level ?? 'D',
        notes: data.notes ?? null,
        tags: data.tags ?? null,
        type: data.type ?? 'INDIVIDUAL',
        source: data.source ?? null,
        referrerName: data.referrerName ?? null,
        preferences: data.preferences ?? undefined,
      } as typeof customers.$inferInsert,
      tenantId,
      userId,
      data.address ? { address: data.address } : undefined
    );

    if (result.isDuplicate) {
      throw new AppError(`手机号 ${data.phone} 已存在 (客户编号: ${result.customer.customerNo})`, ERROR_CODES.INVALID_OPERATION, 400);
    }

    // 精确清除客户列表缓存
    revalidateTag(`customers-list-${tenantId}`, 'default');
    return result.customer;
  } catch (e: unknown) {
    logger.error('[customers] 创建客户失败:', e);
    throw e;
  }
}

/**
 * 更新现有客户信息
 * 
 * 权限要求：CUSTOMER.EDIT
 * 逻辑详情：使用 Service 层处理，包含租户校验、降级校验和审计日志记录
 */
export async function updateCustomer(input: z.input<typeof updateCustomerSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // 权限检查：需要客户编辑权限
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.EDIT)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  const { id, version, data: rawData } = updateCustomerSchema.parse(input);
  const data = trimInput(rawData);

  logger.info('[customers] 更新客户:', { customerId: id, data, userId: session.user.id, tenantId: session.user.tenantId });

  try {
    // 使用 Service 处理业务逻辑（含租户检查、降级校验、审计日志）
    return await CustomerService.updateCustomer(
      id,
      data,
      session.user.tenantId,
      session.user.id,
      version
    );
  } catch (error) {
    logger.error('[customers] 更新客户失败:', error);
    throw error;
  }
}

/**
 * 软删除客户
 * 
 * 权限要求：CUSTOMER.DELETE
 */
export async function deleteCustomer(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // 权限检查
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.DELETE)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  logger.info('[customers] 删除客户:', { customerId: id, userId: session.user.id, tenantId: session.user.tenantId });

  try {
    await CustomerService.deleteCustomer(
      id,
      session.user.tenantId,
      session.user.id
    );

    // 精确清除客户列表缓存
    revalidateTag(`customers-list-${session.user.tenantId}`, 'default');
  } catch (error) {
    logger.error('[customers] 删除客户失败:', error);
    throw error;
  }
}

/**
 * 添加客户地址
 * 
 * 安全检查：需要 CUSTOMER.EDIT 权限
 */
export async function addCustomerAddress(input: z.infer<typeof createAddressSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // 权限检查
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.EDIT)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  const tenantId = session.user.tenantId;
  const data = trimInput(createAddressSchema.parse(input));

  logger.info('[customers] 添加客户地址:', { ...data, userId: session.user.id, tenantId });

  try {
    // 验证客户属于当前租户
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)),
    });
    if (!customer) throw new AppError('客户不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);

    return await db
      .transaction(async (tx) => {
        if (data.isDefault) {
          // Unset other defaults
          await tx
            .update(customerAddresses)
            .set({ isDefault: false })
            .where(eq(customerAddresses.customerId, data.customerId));
        }

        const [newAddr] = await tx
          .insert(customerAddresses)
          .values({
            tenantId,
            customerId: data.customerId,
            label: data.label,
            province: data.province,
            city: data.city,
            district: data.district,
            community: data.community,
            address: data.address,
            isDefault: data.isDefault,
          })
          .returning();

        // 记录审计日志
        await AuditService.log(tx, {
          tableName: 'customer_addresses',
          recordId: newAddr.id,
          action: 'CREATE',
          userId: session.user.id,
          newValues: newAddr,
          details: { customerId: data.customerId, label: data.label },
          tenantId
        });

        return newAddr;
      })
      .then((res) => {
        revalidateTag(`customer-detail-${data.customerId}`, 'default');
        return res;
      });
  } catch (error) {
    logger.error('[customers] 添加客户地址失败:', {
      error,
      customerId: data.customerId,
      userId: session.user.id,
      tenantId: session.user.tenantId
    });
    throw error;
  }
}

/**
 * 更新客户地址
 * 
 * 权限要求：CUSTOMER.EDIT
 */
export async function updateCustomerAddress(input: z.infer<typeof updateAddressSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // [Fix 3.3] 增加权限检查
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.EDIT)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  const { id, version, ...rawData } = updateAddressSchema.parse(input);
  const data = trimInput(rawData);

  logger.info('[customers] 更新客户地址:', { addressId: id, data, userId: session.user.id, tenantId: session.user.tenantId });

  try {
    return await db
      .transaction(async (tx) => {
        // 安全检查：验证地址属于当前租户
        const addr = await tx.query.customerAddresses.findFirst({
          where: and(
            eq(customerAddresses.id, id),
            eq(customerAddresses.tenantId, session.user.tenantId)
          ),
        });
        if (!addr) throw new AppError('地址不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
        if (version !== undefined && addr.version !== version) {
          throw new AppError('数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
        }

        if (data.isDefault) {
          await tx
            .update(customerAddresses)
            .set({ isDefault: false })
            .where(eq(customerAddresses.customerId, addr.customerId));
        }

        const [updated] = await tx
          .update(customerAddresses)
          .set({ ...data, version: (addr.version || 0) + 1 })
          .where(
            and(
              eq(customerAddresses.id, id),
              eq(customerAddresses.tenantId, session.user.tenantId),
              version !== undefined ? eq(customerAddresses.version, version) : undefined
            )
          )
          .returning();

        if (!updated && version !== undefined) {
          throw new AppError('并发更新失败，请重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
        }

        if (updated) {
          await AuditService.log(tx, {
            tableName: 'customer_addresses',
            recordId: id,
            action: 'UPDATE',
            userId: session.user.id,
            changedFields: data,
            details: { customerId: addr.customerId },
            tenantId: session.user.tenantId
          });
        }

        return updated;
      })
      .then((res) => {
        return res;
      });
  } catch (error) {
    logger.error('[customers] 更新客户地址失败:', {
      error,
      addressId: id,
      userId: session.user.id,
      tenantId: session.user.tenantId
    });
    throw error;
  }
}

/**
 * 删除客户地址
 * 
 * 权限要求：CUSTOMER.EDIT
 */
export async function deleteCustomerAddress(id: string, version?: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // 权限检查：需要客户编辑权限
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.EDIT)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  // 安全检查：验证地址属于当前租户
  const existingAddr = await db.query.customerAddresses.findFirst({
    where: and(eq(customerAddresses.id, id), eq(customerAddresses.tenantId, session.user.tenantId)),
  });
  if (!existingAddr) throw new AppError('地址不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);

  if (version !== undefined && existingAddr.version !== version) {
    throw new AppError('数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }

  logger.info('[customers] 删除客户地址:', { addressId: id, version, userId: session.user.id, tenantId: session.user.tenantId });

  try {
    const [deleted] = await db
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, id),
          eq(customerAddresses.tenantId, session.user.tenantId),
          version !== undefined ? eq(customerAddresses.version, version) : undefined
        )
      ).returning();

    if (!deleted && version !== undefined) {
      throw new AppError('并发更新失败，请重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
    }

    // 记录审计日志
    await AuditService.log(db, {
      tableName: 'customer_addresses',
      recordId: id,
      action: 'DELETE',
      userId: session.user.id,
      details: { customerId: existingAddr.customerId },
      tenantId: session.user.tenantId
    });
  } catch (error) {
    logger.error('[customers] 删除客户地址失败:', {
      error,
      addressId: id,
      userId: session.user.id,
      tenantId: session.user.tenantId
    });
    throw error;
  }
}

/**
 * 设置客户的默认地址
 * 
 * 安全检查：需要 CUSTOMER.EDIT 权限
 */
export async function setDefaultAddress(id: string, customerId: string, version?: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // 权限检查
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.EDIT)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  const tenantId = session.user.tenantId;

  // 验证地址和客户属于当前租户
  const address = await db.query.customerAddresses.findFirst({
    where: and(eq(customerAddresses.id, id), eq(customerAddresses.tenantId, tenantId)),
  });
  if (!address) throw new AppError('地址不存在或无权操作', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
  if (version !== undefined && address.version !== version) {
    throw new AppError('数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }

  logger.info('[customers] 设置客户默认地址:', { addressId: id, customerId, version, userId: session.user.id, tenantId });

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(
          and(eq(customerAddresses.customerId, customerId), eq(customerAddresses.tenantId, tenantId))
        );

      const [updated] = await tx
        .update(customerAddresses)
        .set({ isDefault: true, version: (address.version || 0) + 1 })
        .where(
          and(
            eq(customerAddresses.id, id),
            eq(customerAddresses.tenantId, tenantId),
            version !== undefined ? eq(customerAddresses.version, version) : undefined
          )
        ).returning();

      if (!updated && version !== undefined) {
        throw new AppError('并发更新失败，请重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
      }

      // 记录审计日志
      await AuditService.log(tx, {
        tableName: 'customer_addresses',
        recordId: id,
        action: 'UPDATE',
        userId: session.user.id,
        details: { customerId, type: 'SET_DEFAULT' },
        changedFields: { isDefault: true },
        tenantId
      });
    });
    revalidateTag(`customer-detail-${customerId}`, 'default');
  } catch (error) {
    logger.error('[customers] 设置默认地址失败:', {
      error,
      addressId: id,
      customerId,
      userId: session.user.id,
      tenantId
    });
    throw error;
  }
}

/**
 * 合并客户
 * 将多个源客户的数据合并到目标客户，并逻辑删除源客户。
 * 
 * 权限要求：CUSTOMER.MANAGE
 */
export async function mergeCustomersAction(
  input: z.infer<typeof mergeCustomersSchema>,
  userId: string
) {
  const data = mergeCustomersSchema.parse(input);
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // [Fix 3.3] 增加权限检查 (MANAGE 权限)
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.MANAGE)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  logger.info('[customers] 合并客户:', { ...data, userId, tenantId });

  try {
    const result = await CustomerService.mergeCustomers(
      data.targetCustomerId,
      data.sourceCustomerIds,
      data.fieldPriority,
      tenantId,
      userId,
      data.targetCustomerVersion
    );

    // 精确清除客户列表及相关详情缓存
    revalidateTag(`customers-list-${tenantId}`, 'default');
    revalidateTag(`customer-detail-${data.targetCustomerId}`, 'default');
    for (const id of data.sourceCustomerIds) {
      revalidateTag(`customer-detail-${id}`, 'default');
    }

    return result;
  } catch (error) {
    logger.error('[customers] 合并客户失败:', error);
    throw error;
  }
}

/**
 * 预览合并结果
 * 计算合并后的客户数据预览，不进行实际修改。
 * 
 * 权限要求：CUSTOMER.MANAGE
 */
export async function previewMergeAction(sourceId: string, targetId: string) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

  // [Fix 3.3] 增加权限检查 (MANAGE 权限)
  if (!await checkPermission(session, PERMISSIONS.CUSTOMER.MANAGE)) {
    throw new AppError('Permission denied', ERROR_CODES.PERMISSION_DENIED, 403);
  }

  logger.info('[customers] 预览合并客户结果:', { sourceId, targetId, userId: session.user.id, tenantId });

  try {
    return await CustomerService.previewMerge(targetId, sourceId, tenantId);
  } catch (error) {
    logger.error('[customers] 预览合并客户结果失败:', error);
    throw error;
  }
}
