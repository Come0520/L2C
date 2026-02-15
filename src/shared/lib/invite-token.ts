/**
 * 邀请令牌服务
 *
 * 用于生成和验证员工邀请、客户邀请的安全令牌
 */
'use server';

import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/shared/config/env';
import { db } from '@/shared/api/db';
import { users, customers, invitations } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';

// ============================================================
// 类型定义
// ============================================================

/**
 * 邀请类型
 */
export type InviteType = 'employee' | 'customer';

/**
 * 邀请令牌载荷
 */
export interface InviteTokenPayload {
  type: InviteType;
  tenantId: string;
  inviterId: string; // 邀请人 ID
  invitationId?: string; // 邀请记录 ID（用于一次性使用验证）
  customerId?: string; // 客户邀请时的客户 ID
  defaultRole?: string; // @deprecated Use defaultRoles
  defaultRoles?: string[]; // 员工邀请时的默认角色列表
  expiresAt: number;
}

/**
 * 邀请验证结果
 */
export interface InviteValidationResult {
  valid: boolean;
  payload?: InviteTokenPayload;
  error?: string;
}

// ============================================================
// 令牌有效期
// ============================================================

const EMPLOYEE_INVITE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 天
const CUSTOMER_INVITE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 天

// ============================================================
// 密钥获取
// ============================================================

function getSecretKey(): Uint8Array {
  const secret = env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET 环境变量未设置或长度不足');
  }
  return new TextEncoder().encode(secret);
}

// ============================================================
// 员工邀请
// ============================================================

/**
 * 生成员工邀请令牌
 *
 * @param tenantId - 租户 ID
 * @param inviterId - 邀请人（管理员）ID
 * @param defaultRole - 新员工的默认角色
 * @returns 邀请令牌
 */
export async function generateEmployeeInviteToken(
  tenantId: string,
  inviterId: string,
  defaultRoles: string[] = ['SALES']
): Promise<string> {
  const expiresAt = Date.now() + EMPLOYEE_INVITE_EXPIRY;

  // 1. 写入 invitations 表记录
  const [invitation] = await db
    .insert(invitations)
    .values({
      tenantId,
      inviterId,
      code: nanoid(8),
      role: defaultRoles.join(','),
      expiresAt: new Date(expiresAt),
      maxUses: '1', // 一次性使用
      usedCount: '0',
      isActive: true,
    })
    .returning({ id: invitations.id });

  // 2. 生成 JWT 令牌，嵌入 invitationId
  const token = await new SignJWT({
    type: 'employee' as InviteType,
    tenantId,
    inviterId,
    invitationId: invitation.id,
    defaultRoles,
    expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .setIssuer('l2c-invite')
    .sign(getSecretKey());

  return token;
}

/**
 * 生成员工邀请链接
 */
export async function generateEmployeeInviteLink(
  tenantId: string,
  inviterId: string,
  defaultRoles?: string[]
): Promise<string> {
  const token = await generateEmployeeInviteToken(tenantId, inviterId, defaultRoles);
  const baseUrl = env.AUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/register/employee?token=${encodeURIComponent(token)}`;
}

// ============================================================
// 客户邀请
// ============================================================

/**
 * 生成客户邀请令牌
 *
 * @param tenantId - 租户 ID
 * @param inviterId - 邀请人 ID
 * @param customerId - 客户记录 ID
 * @returns 邀请令牌
 */
export async function generateCustomerInviteToken(
  tenantId: string,
  inviterId: string,
  customerId: string
): Promise<string> {
  const expiresAt = Date.now() + CUSTOMER_INVITE_EXPIRY;

  const token = await new SignJWT({
    type: 'customer' as InviteType,
    tenantId,
    inviterId,
    customerId,
    expiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000))
    .setIssuer('l2c-invite')
    .sign(getSecretKey());

  return token;
}

/**
 * 生成客户邀请链接
 */
export async function generateCustomerInviteLink(
  tenantId: string,
  inviterId: string,
  customerId: string
): Promise<string> {
  const token = await generateCustomerInviteToken(tenantId, inviterId, customerId);
  const baseUrl = env.AUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/register/customer?token=${encodeURIComponent(token)}`;
}

// ============================================================
// 令牌验证
// ============================================================

/**
 * 验证邀请令牌
 */
export async function verifyInviteToken(token: string): Promise<InviteValidationResult> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'l2c-invite',
    });

    const invitePayload = payload as unknown as InviteTokenPayload;

    // 检查是否过期
    if (invitePayload.expiresAt < Date.now()) {
      return { valid: false, error: '邀请链接已过期' };
    }

    return { valid: true, payload: invitePayload };
  } catch {
    return { valid: false, error: '无效的邀请链接' };
  }
}

// ============================================================
// 用户注册处理
// ============================================================

/**
 * 通过员工邀请注册用户
 */
export async function registerEmployeeByInvite(
  token: string,
  userData: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    wechatOpenId?: string;
  }
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const validation = await verifyInviteToken(token);
    if (!validation.valid || !validation.payload) {
      return { success: false, error: validation.error };
    }

    const { tenantId, invitationId } = validation.payload;

    // 1. 验证 invitations 表记录是否有效
    if (invitationId) {
      const invitation = await db.query.invitations.findFirst({
        where: eq(invitations.id, invitationId),
      });

      if (!invitation) {
        return { success: false, error: '邀请记录不存在' };
      }

      if (!invitation.isActive) {
        return { success: false, error: '邀请链接已失效' };
      }

      const usedCount = parseInt(invitation.usedCount || '0');
      const maxUses = parseInt(invitation.maxUses || '1');
      if (usedCount >= maxUses) {
        return { success: false, error: '邀请链接已达最大使用次数' };
      }
    }

    // 2. 检查手机号是否在当前租户内已存在
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.phone, userData.phone), eq(users.tenantId, tenantId)),
    });
    if (existingUser) {
      return { success: false, error: '该手机号已注册' };
    }

    // 3. 如果用户提供了真实邮箱，检查邮箱在当前租户内的唯一性
    if (userData.email) {
      const existingEmail = await db.query.users.findFirst({
        where: and(eq(users.email, userData.email), eq(users.tenantId, tenantId)),
      });
      if (existingEmail) {
        return { success: false, error: '该邮箱已被使用' };
      }
    }

    // 4. 创建用户
    const passwordHash = await hash(userData.password, 12);

    // 兼容旧 payload (defaultRole)
    const roles =
      validation.payload.defaultRoles ||
      (validation.payload.defaultRole ? [validation.payload.defaultRole] : ['SALES']);

    const [newUser] = await db
      .insert(users)
      .values({
        tenantId,
        name: userData.name,
        phone: userData.phone,
        email: userData.email || null, // 移除临时邮箱，改为 null
        passwordHash,
        role: roles[0] || 'SALES', // Backup compatibility
        roles: roles, // Multi-role
        permissions: [], // 空权限，需管理员分配
        wechatOpenId: userData.wechatOpenId,
        isActive: true,
      })
      .returning({ id: users.id });

    // 5. 更新 invitations 表，标记为已使用
    if (invitationId) {
      await db
        .update(invitations)
        .set({
          usedCount: '1',
          isActive: false, // 一次性使用，直接标记失效
          updatedAt: new Date(),
        })
        .where(eq(invitations.id, invitationId));
    }

    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error('员工注册失败:', error);
    // 处理常见的数据库错误
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return { success: false, error: '该手机号或邮箱已被使用' };
    }
    return { success: false, error: '注册过程中发生错误，请稍后重试' };
  }
}

/**
 * 通过客户邀请注册用户
 */
export async function registerCustomerByInvite(
  token: string,
  userData: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    wechatOpenId?: string;
  }
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const validation = await verifyInviteToken(token);
    if (!validation.valid || !validation.payload) {
      return { success: false, error: validation.error };
    }

    const { tenantId, customerId } = validation.payload;

    if (!customerId) {
      return { success: false, error: '无效的客户邀请' };
    }

    // 验证客户记录存在
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
    });
    if (!customer) {
      return { success: false, error: '客户记录不存在' };
    }

    // 检查手机号是否已存在
    const existingUser = await db.query.users.findFirst({
      where: eq(users.phone, userData.phone),
    });
    if (existingUser) {
      return { success: false, error: '该手机号已注册' };
    }

    // 如果用户提供了真实邮箱，检查邮箱唯一性
    if (userData.email) {
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, userData.email),
      });
      if (existingEmail) {
        return { success: false, error: '该邮箱已被使用' };
      }
    }

    // 创建用户
    const passwordHash = await hash(userData.password, 12);

    // 邮箱处理：优先使用用户提供的真实邮箱，否则生成唯一临时邮箱
    const email = userData.email || `${userData.phone}_${Date.now().toString(36)}@customer.l2c.com`;

    const [newUser] = await db
      .insert(users)
      .values({
        tenantId,
        name: userData.name,
        phone: userData.phone,
        email,
        passwordHash,
        role: 'CUSTOMER',
        permissions: ['customer:view_orders', 'customer:view_progress'], // 客户默认权限
        wechatOpenId: userData.wechatOpenId,
        isActive: true,
      })
      .returning({ id: users.id });

    // 更新客户记录关联微信 OpenId（如果提供）
    if (userData.wechatOpenId) {
      await db
        .update(customers)
        .set({ wechatOpenId: userData.wechatOpenId })
        .where(eq(customers.id, customerId));
    }

    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error('客户注册失败:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return { success: false, error: '该手机号或邮箱已被使用' };
    }
    return { success: false, error: '注册过程中发生错误，请稍后重试' };
  }
}
