/**
 * 生成员工邀请码 API
 *
 * POST /api/miniprogram/invite/generate
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, invitations } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { withMiniprogramAuth } from '../../auth-utils';
import { customAlphabet } from 'nanoid';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiForbidden,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { RolePermissionService } from '@/shared/lib/role-permission-service';
import { PERMISSIONS } from '@/shared/config/permissions';

// 允许邀请的角色白名单
const ALLOWED_INVITE_ROLES = [
  'SALES',
  'INSTALLER',
  'MEASURER',
  'ShowroomManager',
  'ADMIN',
  'MANAGER',
];

export const POST = withMiniprogramAuth(async (request: NextRequest, user) => {
  try {
    // 1. 验证请求者权限（必须拥有用户管理权限）
    const hasUserManage = await RolePermissionService.hasPermission(
      user.id,
      PERMISSIONS.SETTINGS.USER_MANAGE
    );
    if (!hasUserManage) {
      return apiForbidden('无权限生成邀请码');
    }

    // 检查租户是否已激活
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant || tenant.status !== 'active') {
      return apiForbidden('企业未激活，无法邀请员工');
    }

    const body = await request.json();
    const { role = 'SALES', roles } = body;
    // 兼容处理：如果前端传了 roles 数组则使用，否则回退到单 role
    const targetRoles = roles && roles.length > 0 ? roles : [role];

    // 2. 验证目标角色白名单 (防止角色注入)
    const invalidRoles = targetRoles.filter((r: string) => !ALLOWED_INVITE_ROLES.includes(r));
    if (invalidRoles.length > 0) {
      return apiBadRequest(`Invalid roles: ${invalidRoles.join(', ')}`);
    }

    const maxUses = body.maxUses || '1'; // 默认单次有效

    // 生成6位数字邀请码 (方便输入)
    const generateCode = customAlphabet('0123456789', 6);
    const inviteCode = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天有效期

    // 保存到数据库
    await db.insert(invitations).values({
      tenantId: user.tenantId,
      inviterId: user.id,
      code: inviteCode,
      role,
      expiresAt,
      maxUses: String(maxUses),
      isActive: true,
    });

    // 生成邀请 Token
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const inviteToken = await new SignJWT({
      type: 'employee_invite',
      tenantId: user.tenantId,
      inviterId: user.id,
      defaultRole: targetRoles[0], // 保持向后兼容
      defaultRoles: targetRoles, // 新增多角色支持
      inviteCode,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(secret);

    // 邀请链接（Web 端）
    const baseUrl = process.env.AUTH_URL || 'https://your-domain.com';
    const inviteLink = `${baseUrl}/register/employee?token=${inviteToken}`;

    // 小程序码 URL（Mock Implementation）
    // 使用公共 HTTPS 二维码生成服务，确保小程序可以加载
    const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}`;

    // 3. 审计日志
    const { AuditService } = await import('@/shared/services/audit-service');
    await AuditService.log(db, {
      tableName: 'invitations',
      recordId: inviteCode,
      action: 'GENERATE_INVITE',
      userId: user.id,
      tenantId: user.tenantId,
      details: { role, maxUses },
    });

    return apiSuccess({
      inviteCode,
      inviteLink,
      qrcodeUrl,
      expiresAt: expiresAt.toISOString(),
      role,
    });
  } catch (error) {
    logger.error('[InviteGenerate] 生成邀请码失败', { route: 'invite/generate', error });
    return apiServerError('生成邀请码失败');
  }
});
