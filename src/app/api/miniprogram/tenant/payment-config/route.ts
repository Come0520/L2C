/**
 * 租户支付配置 API
 *
 * GET /api/miniprogram/tenant/payment-config  — 获取支付配置（需 ADMIN 角色）
 * POST /api/miniprogram/tenant/payment-config — 更新支付配置（需 ADMIN 角色）
 *
 * 安全策略：通过 withMiniprogramAuth(['ADMIN']) 强制角色校验，
 * 替代原有的自定义 verifyAdmin 函数，统一认证模式。
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq, sql } from 'drizzle-orm';
import { withMiniprogramAuth, AuthUser } from '../../auth-utils';
import { apiSuccess, apiBadRequest, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { z } from 'zod';

// 定义支付配置 Schema，防御 JSON 注入
const PaymentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  offline: z
    .object({
      enabled: z.boolean().default(true),
      instructions: z.string().max(1000, '说明文字过长').default(''),
    })
    .optional(),
  online: z
    .object({
      enabled: z.boolean().default(false),
    })
    .optional(),
});

/** 获取支付配置（仅 ADMIN） */
export const GET = withMiniprogramAuth(
  async (_request: NextRequest, user: AuthUser) => {
    try {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
        columns: { settings: true },
      });

      const settings = (tenant?.settings as Record<string, unknown>) || {};
      // 使用 safeParse 确保返回的数据符合结构
      const paymentParse = PaymentConfigSchema.safeParse(settings.payment);
      const paymentConfig = paymentParse.success
        ? paymentParse.data
        : {
            enabled: true,
            offline: { enabled: true, instructions: '' },
            online: { enabled: false },
          };

      return apiSuccess(paymentConfig);
    } catch (error) {
      logger.error('[TenantConfig] 获取支付配置异常', { route: 'tenant/payment-config', error });
      return apiServerError('获取支付配置失败');
    }
  },
  ['ADMIN']
);

/** 更新支付配置（仅 ADMIN） */
export const POST = withMiniprogramAuth(
  async (request: NextRequest, user: AuthUser) => {
    try {
      const body = await request.json();

      // 1. Zod 安全校验 (防止 JSON 注入)
      const validation = PaymentConfigSchema.safeParse(body);
      if (!validation.success) {
        return apiBadRequest(validation.error.issues[0].message);
      }

      // 2. 事务中执行读写锁 (FOR UPDATE)
      await db.transaction(async (tx) => {
        // 获取当前租户配置并加锁
        const [tenant] = (await tx.execute(
          sql`SELECT settings FROM ${tenants} WHERE id = ${user.tenantId} FOR UPDATE`
        )) as unknown as [{ settings: Record<string, unknown> }];

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
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, user.tenantId));
      });

      // 3. 审计日志
      const { AuditService } = await import('@/shared/services/audit-service');
      await AuditService.log(db, {
        tableName: 'tenants',
        recordId: user.tenantId,
        action: 'UPDATE_PAYMENT_CONFIG',
        userId: user.id,
        tenantId: user.tenantId,
        details: validation.data,
      });

      return apiSuccess(null);
    } catch (error) {
      logger.error('[TenantConfig] 更新支付配置异常', { route: 'tenant/payment-config', error });
      return apiServerError('更新支付配置失败');
    }
  },
  ['ADMIN']
);
