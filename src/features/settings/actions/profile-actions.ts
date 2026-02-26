'use server';

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { createSafeAction } from '@/shared/lib/server-action';
import { AuditService } from '@/shared/services/audit-service';
import { eq, ne, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import { logger } from '@/shared/lib/logger';

/**
 * 更新个人信息 Schema
 */
const updateProfileSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  phone: z
    .string()
    .regex(/^\d{8,11}$/, '手机号格式不正确')
    .optional()
    .or(z.literal('')),
  image: z.string().url('头像链接无效').optional().or(z.literal('')),
});

/**
 * 更新个人信息 Action
 */
export const updateProfile = createSafeAction(updateProfileSchema, async (data, ctx) => {
  const session = ctx.session;
  if (!session?.user?.id) {
    return { success: false, error: '未授权' };
  }

  const userId = session.user.id;

  try {
    // 1. 获取旧数据用于审计 & 检查手机号唯一性
    const [currentUser, existingUser] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
      }),
      data.phone
        ? db.query.users.findFirst({
            where: and(
              eq(users.phone, data.phone),
              ne(users.id, userId) // 排除自己
            ),
          })
        : Promise.resolve(null),
    ]);

    if (existingUser) {
      return { success: false, error: '手机号已被其他用户使用' };
    }

    if (!currentUser) {
      return { success: false, error: '用户不存在' };
    }

    // 3. 更新数据库
    await db
      .update(users)
      .set({
        name: data.name,
        phone: data.phone || undefined, // undefined prevents Drizzle from updating if empty
        avatarUrl: data.image || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 4. 记录审计日志
    await AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'UPDATE',
      userId: userId,
      tenantId: session.user.tenantId, // 假设 session 中有 tenantId
      oldValues: {
        name: currentUser.name,
        phone: currentUser.phone,
        avatarUrl: currentUser.avatarUrl,
      },
      newValues: {
        name: data.name,
        phone: data.phone || null,
        avatarUrl: data.image || null,
      },
      changedFields: data,
    });

    revalidatePath('/settings/preferences');
    revalidatePath('/profile'); // 假设有个人中心页

    return { success: true, message: '个人信息已更新' };
  } catch (error) {
    logger.error('更新个人信息失败:', error);
    return { success: false, error: '更新失败，请稍后重试' };
  }
});

/**
 * 修改密码 Schema
 */
const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入旧密码'),
    newPassword: z
      .string()
      .min(8, '密码至少8位')
      .regex(/[a-zA-Z]/, '密码必须包含字母')
      .regex(/[0-9]/, '密码必须包含数字'),
    confirmPassword: z.string().min(1, '请确认新密码'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: '新密码不能与旧密码相同',
    path: ['newPassword'],
  });

/**
 * 修改密码 Action
 */
export const changePassword = createSafeAction(changePasswordSchema, async (data, ctx) => {
  const session = ctx.session;
  if (!session?.user?.id) {
    return { success: false, error: '未授权' };
  }

  const userId = session.user.id;

  try {
    // 1. 获取当前用户
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser || !currentUser.passwordHash) {
      return { success: false, error: '用户不存在或未设置密码' };
    }

    // 2. 验证旧密码
    const isValidPassword = await compare(data.oldPassword, currentUser.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: '旧密码错误' };
    }

    // 3. 生成新密码哈希
    const newPasswordHash = await hash(data.newPassword, 10);

    // 4. 更新数据库
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 5. 记录审计日志
    await AuditService.log(db, {
      tableName: 'users',
      recordId: userId,
      action: 'UPDATE',
      userId: userId,
      tenantId: session.user.tenantId,
      oldValues: { passwordHash: '***' },
      newValues: { passwordHash: '***' },
      changedFields: { passwordChanged: true },
    });

    return { success: true, message: '密码已成功修改' };
  } catch (error) {
    logger.error('修改密码失败:', error);
    return { success: false, error: '修改密码失败，请稍后重试' };
  }
});
