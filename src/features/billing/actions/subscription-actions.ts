'use server';
/**
 * 订阅管理 Server Actions
 * 处理订阅的完整生命周期：发起支付、激活订阅、查询状态、取消
 */
import { db } from '@/shared/api/db';
import { eq, and, desc } from 'drizzle-orm';
import { subscriptions, billingPaymentRecords, tenants } from '@/shared/api/schema';
import { createNativePayOrder } from '../lib/wechat-pay';
import { createAlipayFaceToFaceOrder } from '../lib/alipay';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('BillingAction');

// ==================== 类型定义 ====================

/** 支付渠道 */
type PaymentProvider = 'WECHAT' | 'ALIPAY' | 'MANUAL';

/** 套餐类型 */
type PlanType = 'pro' | 'enterprise';

/** 发起支付的参数 */
export interface InitiatePaymentParams {
  tenantId: string;
  planType: PlanType;
  provider: PaymentProvider;
  /** 支付成功回调地址（绝对 URL） */
  notifyUrl: string;
  /** 支付宝专用：同步跳转地址 */
  returnUrl?: string;
}

/** 发起支付结果 */
export interface InitiatePaymentResult {
  /** 用于展示的二维码 URL 或 HTML 表单字符串 */
  paymentData: string;
  /** 商户订单号（用于轮询查询状态） */
  outTradeNo: string;
}

/** 激活订阅的参数（由 Webhook 调用） */
export interface ActivateSubscriptionParams {
  provider: PaymentProvider;
  /** 商户订单号 */
  outTradeNo: string;
  /** 第三方支付流水号 */
  externalPaymentId: string;
  /** 支付金额（分） */
  amountCents: number;
  /** 原始回调数据（用于对账） */
  rawPayload: unknown;
  /** 附加数据（含 tenantId 和 planType） */
  attach?: string;
}

// ==================== 套餐价格配置 ====================

const PLAN_PRICES: Record<PlanType, { amountCents: number; label: string }> = {
  pro: { amountCents: 9900, label: '专业版月费 ¥99/月' },
  enterprise: { amountCents: 49900, label: '企业版月费 ¥499/月' },
};

// ==================== 生成商户订单号 ====================

/**
 * 生成唯一商户订单号
 * 格式：L2C_{tenantId前8位}_{时间戳}_{随机4位}
 * 例如: L2C_a1b2c3d4_1741234567890_x7k2
 */
function generateOutTradeNo(tenantId: string): string {
  const prefix = 'L2C';
  const tenantPrefix = tenantId.replace(/-/g, '').substring(0, 8);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${tenantPrefix}_${timestamp}_${random}`;
}

// ==================== 发起支付 ====================

/**
 * 发起支付（创建微信或支付宝订单）
 * 在 relation 中存储 tenantId 和 planType，供回调激活订阅使用
 *
 * @example
 * ```ts
 * const { paymentData, outTradeNo } = await initiatePayment({
 *   tenantId: 'xxx',
 *   planType: 'pro',
 *   provider: 'wechat',
 *   notifyUrl: 'https://example.com/api/webhooks/wechat',
 * });
 * // 前端用 paymentData（二维码 URL）渲染 QR 图
 * ```
 */
export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const { tenantId, planType, provider, notifyUrl } = params;
  const plan = PLAN_PRICES[planType];
  const outTradeNo = generateOutTradeNo(tenantId);

  // 将 tenantId 和 planType 编码到 attach 字段，回调时解析
  const attach = JSON.stringify({ tenantId, planType });

  // 在数据库中创建 pending 状态的订阅记录
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const session = await auth().catch(() => null);

  await db.transaction(async (tx) => {
    const [newSub] = await tx.insert(subscriptions).values({
      tenantId,
      planType,
      status: 'PENDING', // 先占位，Webhook 回调后确认
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      paymentProvider: provider,
      amountCents: plan.amountCents,
      currency: 'CNY',
      autoRenew: true,
    } as typeof subscriptions.$inferInsert).returning();

    if (session?.user) {
      await AuditService.log(tx, {
        tableName: 'subscriptions',
        recordId: newSub.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId,
        newValues: newSub as Record<string, unknown>,
      });
    }
  });

  // 根据渠道发起支付
  if (provider === 'WECHAT') {
    const result = await createNativePayOrder({
      description: plan.label,
      outTradeNo,
      amountCents: plan.amountCents,
      notifyUrl,
      attach,
    });
    return { paymentData: result.codeUrl, outTradeNo };
  }

  if (provider === 'ALIPAY') {
    const result = await createAlipayFaceToFaceOrder({
      subject: plan.label,
      outTradeNo,
      totalAmount: (plan.amountCents / 100).toFixed(2),
      notifyUrl,
      passbackParams: attach,
    });
    return { paymentData: result.qrCode, outTradeNo };
  }

  throw new Error(`不支持的支付渠道: ${provider}`);
}

// ==================== 激活订阅（Webhook 调用）====================

/**
 * 根据支付回调激活订阅
 * 幂等操作：同一 outTradeNo 重复调用安全
 *
 * @param params - 从 Webhook 解析出的支付信息
 */
export async function activateSubscriptionByPayment(
  params: ActivateSubscriptionParams
): Promise<void> {
  const { provider, outTradeNo, externalPaymentId, amountCents, rawPayload, attach } = params;

  // 解析 attach 字段获取租户信息
  let tenantId: string;
  let planType: PlanType;

  try {
    const attachData = JSON.parse(attach ?? '{}');
    tenantId = attachData.tenantId;
    planType = attachData.planType ?? 'pro';

    if (!tenantId) throw new Error('attach 中缺少 tenantId');
  } catch (error) {
    throw new Error(`无法解析 attach 字段: ${attach}, 错误: ${error}`);
  }

  // 防伪校验：验证回调数据未被篡改跨租户
  const tenantPrefix = tenantId.replace(/-/g, '').substring(0, 8);
  if (outTradeNo.split('_')[1] !== tenantPrefix) {
    logger.error('[ActivateSubscription] Webhook 防伪校验失败', { outTradeNo, attach });
    throw new Error('Webhook 订单归属校验防伪失败');
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await db.transaction(async (tx: any) => {
    // 行级悲观锁：锁定对应的租户，确保同一时间只有一个 Webhook 线程进入激活流程
    const protectedTenant = await tx.select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .for('update')
      .limit(1);

    if (protectedTenant.length === 0) {
      logger.error('未找到所属租户', { tenantId });
      throw new Error('未找到所属租户');
    }

    // 幂等检查：在加锁后校验，若已处理过该 outTradeNo，安全跳过
    const existingPayment = await tx
      .select({ id: billingPaymentRecords.id })
      .from(billingPaymentRecords)
      .where(eq(billingPaymentRecords.externalPaymentId, externalPaymentId))
      .limit(1);

    if (existingPayment.length > 0) {
      logger.info('[ActivateSubscription] 幂等跳过，已处理过', { outTradeNo, externalPaymentId });
      return;
    }
    // 1. 更新租户套餐状态
    await tx
      .update(tenants)
      .set({
        planType,
        planExpiresAt: nextMonth,
        updatedAt: now,
      } as Partial<typeof tenants.$inferInsert>)
      .where(eq(tenants.id, tenantId));

    // 2. 更新订阅记录（找最新的 pending subscription）
    const latestSub = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.tenantId, tenantId), eq(subscriptions.planType, planType)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (latestSub.length > 0) {
      await tx
        .update(subscriptions)
        .set({
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          externalSubscriptionId: externalPaymentId,
          updatedAt: now,
        } as Partial<typeof subscriptions.$inferInsert>)
        .where(eq(subscriptions.id, latestSub[0].id));
    }

    // 3. 写入支付流水记录
    const [insertedPayment] = await tx.insert(billingPaymentRecords).values({
      tenantId,
      paymentProvider: provider,
      externalPaymentId,
      amountCents,
      currency: 'CNY',
      status: 'SUCCEEDED',
      description: `${PLAN_PRICES[planType]?.label ?? planType} - ${now.toISOString().slice(0, 7)}`,
      paidAt: now,
      rawWebhookPayload: rawPayload as Record<string, unknown>,
    } as typeof billingPaymentRecords.$inferInsert).returning();

    // 记录审计日志，考虑到 Webhook 是匿名调用，使用 SYSTEM 作为执行人
    await AuditService.log(tx, {
      tableName: 'billing_payment_records',
      recordId: insertedPayment.id,
      action: 'CREATE',
      userId: 'SYSTEM',
      tenantId,
      newValues: insertedPayment as Record<string, unknown>,
    });
  });

  logger.info('[ActivateSubscription] 订阅激活成功', {
    tenantId,
    planType,
    provider,
    externalPaymentId,
    expiresAt: nextMonth.toISOString(),
  });
}

// ==================== 查询当前订阅状态 ====================

export async function getTenantSubscription(tenantId: string) {
  const tenant = await db
    .select({
      planType: tenants.planType,
      planExpiresAt: tenants.planExpiresAt,
      isGrandfathered: tenants.isGrandfathered,
      maxUsers: tenants.maxUsers,
      purchasedModules: tenants.purchasedModules,
      storageQuota: tenants.storageQuota,
      trialEndsAt: tenants.trialEndsAt,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant.length) return null;

  const t = tenant[0];
  const now = new Date();
  const isExpired = t.planExpiresAt ? t.planExpiresAt < now : false;

  return {
    planType: t.planType ?? 'base',
    planExpiresAt: t.planExpiresAt,
    isGrandfathered: t.isGrandfathered ?? false,
    maxUsers: t.maxUsers,
    purchasedModules: t.purchasedModules,
    storageQuota: t.storageQuota,
    trialEndsAt: t.trialEndsAt,
    isExpired,
    isActive: !isExpired || t.isGrandfathered,
  };
}

// ==================== 续费（手动发起新一期） ====================

/**
 * 发起续费支付（与首次购买逻辑相同，只是使用当前套餐类型）
 */
export async function renewSubscription(
  tenantId: string,
  provider: PaymentProvider,
  notifyUrl: string
): Promise<InitiatePaymentResult> {
  const subscription = await getTenantSubscription(tenantId);
  const planType = (subscription?.planType as PlanType) ?? 'pro';

  return initiatePayment({ tenantId, planType, provider, notifyUrl });
}

// ==================== 取消订阅 ====================

/**
 * 取消自动续费（不立即降级，等当期到期后再降）
 */
export async function cancelSubscription(tenantId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.tenantId !== tenantId) {
    throw new Error('FORBIDDEN');
  }

  await checkPermission(session, PERMISSIONS.ADMIN.TENANT_MANAGE);

  await db.transaction(async (tx: any) => {
    const updatedSubs = await tx
      .update(subscriptions)
      .set({
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: '用户主动取消',
        updatedAt: new Date(),
      } as Partial<typeof subscriptions.$inferInsert>)
      .where(and(eq(subscriptions.tenantId, tenantId), eq(subscriptions.status, 'ACTIVE')))
      .returning();

    for (const sub of updatedSubs) {
      await AuditService.log(tx, {
        tableName: 'subscriptions',
        recordId: sub.id,
        action: 'UPDATE',
        userId: session.user.id,
        tenantId,
        newValues: { autoRenew: false, cancelReason: '用户主动取消' } as Record<string, unknown>,
      });
    }
  });
}
