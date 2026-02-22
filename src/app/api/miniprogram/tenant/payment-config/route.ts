/**
 * 租户支付配置 API
 *
 * GET /api/miniprogram/tenant/payment-config
 * POST /api/miniprogram/tenant/payment-config
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

import { z } from 'zod';
import { sql } from 'drizzle-orm';

// 定义支付配置 Schema，防御 JSON 注入
const PaymentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  offline: z.object({
    enabled: z.boolean().default(true),
    instructions: z.string().max(1000, '说明文字过长').default(''),
  }).optional(),
  online: z.object({
    enabled: z.boolean().default(false),
  }).optional(),
});

// Helper: 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const authUser = await getMiniprogramUser(request);
  if (!authUser) return null;
  try {
    // 从数据库获取用户角色
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, authUser.id),
      columns: { id: true, role: true, tenantId: true },
    });

    if (user?.role === 'admin' || user?.role === 'BOSS') {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return apiError('无权限', 403);
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId!),
      columns: { settings: true },
    });

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    // 使用 safeParse 确保返回的数据符合结构
    const paymentParse = PaymentConfigSchema.safeParse(settings.payment);
    const paymentConfig = paymentParse.success ? paymentParse.data : {
      enabled: true,
      offline: { enabled: true, instructions: '' },
      online: { enabled: false },
    };

    return apiSuccess(paymentConfig);
  } catch (error) {
    logger.error('[TenantConfig] 获取支付配置异常', { route: 'tenant/payment-config', error });
    return apiError('获取支付配置失败', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return apiError('无权限', 403);
    }

    const body = await request.json();

    // 1. Zod 安全校验 (防止 JSON 注入)
    const validation = PaymentConfigSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // 2. 事务中执行读写锁 (FOR UPDATE)
    await db.transaction(async (tx) => {
      // 获取当前租户配置并加锁
      const [tenant] = await tx.execute(
        sql`SELECT settings FROM ${tenants} WHERE id = ${user.tenantId!} FOR UPDATE`
      ) as unknown as [{ settings: Record<string, unknown> }];

      if (!tenant) throw new Error('租户不存在');

      const currentSettings = (tenant.settings as Record<string, unknown>) || {};
      const newSettings = {
        ...currentSettings,
        payment: validation.data,
      };

      // 执行更新
      await tx
        .update(tenants)
        .set({
          settings: newSettings,
          updatedAt: new Date()
        })
        .where(eq(tenants.id, user.tenantId!));
    });

    // 3. 审计日志
    const { AuditService } = await import('@/shared/services/audit-service');
    await AuditService.log(db, {
      tableName: 'tenants',
      recordId: user.tenantId!,
      action: 'UPDATE_PAYMENT_CONFIG',
      userId: user.id,
      tenantId: user.tenantId!,
      details: validation.data
    });

    return apiSuccess(null);
  } catch (error) {
    logger.error('[TenantConfig] 更新支付配置异常', { route: 'tenant/payment-config', error });
    return apiError('更新支付配置失败', 500);
  }
}
