/**
 * 小程序租户申请 API
 *
 * POST /api/miniprogram/tenant/apply - 提交入驻申请
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants, users } from '@/shared/api/schema';
import { hash } from 'bcryptjs';
import { nanoid } from 'nanoid';
import { eq, or } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken } from '../../auth-utils';
import { AuditService } from '@/shared/services/audit-service';

import { z } from 'zod';

// 定义注册 Schema
const RegisterSchema = z.object({
  companyName: z.string().min(2, '公司名称至少2个字符').max(100, '公司名称过长'),
  applicantName: z.string().min(2, '联系人姓名至少2个字符').max(50, '联系人姓名过长'),
  phone: z.string().regex(/^\d{8,11}$/, '手机号格式不正确'),
  email: z.string().email('邮箱格式不正确'),
  region: z.string().min(2, '请选择地区'),
  password: z.string().min(8, '密码至少8位').max(32, '密码过长'),
  businessDescription: z.string().optional(),
  openId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Zod 安全校验
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const {
      companyName,
      applicantName,
      phone,
      email,
      region,
      password,
      businessDescription,
      openId,
    } = validation.data;

    // 2. 深度检查手机号/邮箱是否已存在 (防御重复注册)
    const existingUser = await db.query.users.findFirst({
      where: or(eq(users.phone, phone), eq(users.email, email)),
    });

    if (existingUser) {
      return apiError('该手机号或邮箱已被注册，请直接登录', 400);
    }

    // 3. 生成唯一租户代码 (高强度 ID)
    const tenantCode = `T${nanoid(10).toUpperCase()}`;

    // 4. 原子性事务创建
    const result = await db.transaction(async (tx) => {
      // 创建待审批租户
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: companyName,
          code: tenantCode,
          status: 'pending_approval',
          applicantName,
          applicantPhone: phone,
          applicantEmail: email,
          region,
          businessDescription: businessDescription || null,
          isActive: false,
        })
        .returning();

      // 创建 BOSS 用户 (默认禁用)
      const passwordHash = await hash(password, 12);
      const [newUser] = await tx
        .insert(users)
        .values({
          tenantId: newTenant.id,
          name: applicantName,
          phone,
          email,
          passwordHash,
          role: 'BOSS',
          isActive: false,
          wechatOpenId: openId || null,
          permissions: [],
        })
        .returning();

      return { tenant: newTenant, user: newUser };
    });

    // 5. 签发受限 Token（待审批用户仅 24h 有效期）
    const token = await generateMiniprogramToken(result.user.id, result.tenant.id, {
      type: 'miniprogram_pending',
      expiresIn: '24h',
    });

    // 6. 审计日志
    await AuditService.log(db, {
      tableName: 'tenants',
      recordId: result.tenant.id,
      action: 'APPLY',
      userId: result.user.id,
      tenantId: result.tenant.id,
      details: { companyName, applicantName, phone },
    });

    logger.info('[TenantApply] 新租户申请提交', {
      route: 'tenant/apply',
      tenantId: result.tenant.id,
      userId: result.user.id,
    });

    return apiSuccess({
      tenantId: result.tenant.id,
      user: {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        role: result.user.role,
        tenantStatus: 'pending_approval',
      },
      token,
    });
  } catch (error) {
    logger.error('[TenantApply] 租户申请异常', { route: 'tenant/apply', error });
    // 安全：不向客户端暴露 error.message 技术细节
    return apiError('提交失败，请稍后重试', 500);
  }
}
