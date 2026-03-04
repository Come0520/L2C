/**
 * 订阅生命周期监控（Cron Job）
 * 定期执行的后台任务，用于处理订阅状态流转和续费提醒
 *
 * 建议运行频率：每天凌晨执行一次（例如 02:00）
 */
import { db } from '@/shared/api/db';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { subscriptions, tenants } from '@/shared/api/schema';

// ==================== 常量配置 ====================

/** 提前几天发送续费提醒 */
const RENEWAL_REMINDER_DAYS_AHEAD = 3;
/** 过期后的宽限期（天数），超过此时间将正式变更为 expired */
const GRACE_PERIOD_DAYS = 3;

export async function processSubscriptionsCron() {
  const now = new Date();

  console.warn('[SubscriptionMonitor] 开始执行订阅状态监控任务', now.toISOString());

  // 1. 处理已过期、进入宽限期的订阅 (status: active -> past_due)
  const expiredActiveSubscriptions = await db
    .select({ id: subscriptions.id, tenantId: subscriptions.tenantId })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.status, 'ACTIVE'), lte(subscriptions.currentPeriodEnd, sql`${now}`))
    );

  if (expiredActiveSubscriptions.length > 0) {
    const expiredIds = expiredActiveSubscriptions.map((sub) => sub.id);

    // 事务批量更新状态
    await db.transaction(async (tx) => {
      // 变更订阅状态为 past_due
      for (const id of expiredIds) {
        await tx
          .update(subscriptions)
          .set({ status: 'PAST_DUE', updatedAt: now })
          .where(eq(subscriptions.id, id));
      }
    });

    console.warn(
      `[SubscriptionMonitor] 已将 ${expiredIds.length} 个 active 订阅标记为 past_due (进入宽限期)`
    );
  }

  // 2. 处理宽限期结束、正式到期的订阅 (status: past_due -> expired)
  const gracePeriodEndTime = new Date(now);
  gracePeriodEndTime.setDate(gracePeriodEndTime.getDate() - GRACE_PERIOD_DAYS);

  const completelyExpiredSubscriptions = await db
    .select({ id: subscriptions.id, tenantId: subscriptions.tenantId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'PAST_DUE'),
        lte(subscriptions.currentPeriodEnd, sql`${gracePeriodEndTime}`)
      )
    );

  if (completelyExpiredSubscriptions.length > 0) {
    // 正式过期，剥夺权益（更新租户套餐类型降级为 free）
    await db.transaction(async (tx) => {
      for (const sub of completelyExpiredSubscriptions) {
        // 更新订阅状态为 expired
        await tx
          .update(subscriptions)
          .set({ status: 'EXPIRED', updatedAt: now })
          .where(eq(subscriptions.id, sub.id));

        // 租户降级到免费版
        await tx
          .update(tenants)
          .set({ planType: 'base', updatedAt: now })
          .where(
            and(
              eq(tenants.id, sub.tenantId),
              eq(tenants.isGrandfathered, false) // 祖父条款用户不受影响
            )
          );
      }
    });

    console.warn(
      `[SubscriptionMonitor] 已将 ${completelyExpiredSubscriptions.length} 个进入宽限期结束的订阅正式变更为 expired，并触发免费版降级`
    );
  }

  // 3. 筛选出即将到期的订阅（例如 3 天后到期），用于发送续费提醒通知
  const reminderTimeStart = new Date(now);
  reminderTimeStart.setDate(reminderTimeStart.getDate() + RENEWAL_REMINDER_DAYS_AHEAD);
  reminderTimeStart.setHours(0, 0, 0, 0); // 提醒日期的 00:00

  const reminderTimeEnd = new Date(reminderTimeStart);
  reminderTimeEnd.setHours(23, 59, 59, 999); // 提醒日期的 23:59

  const expiringSoonSubscriptions = await db
    .select({ id: subscriptions.id, tenantId: subscriptions.tenantId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, 'ACTIVE'),
        eq(subscriptions.autoRenew, true),
        lte(subscriptions.currentPeriodEnd, sql`${reminderTimeEnd}`),
        gte(subscriptions.currentPeriodEnd, sql`${reminderTimeStart}`)
      )
    );

  if (expiringSoonSubscriptions.length > 0) {
    // 这里未来接入邮件/短信/系统内消息发送服务
    console.warn(
      `[SubscriptionMonitor] 发现 ${expiringSoonSubscriptions.length} 个即将到期的订阅，准备发送续费提醒...`
    );
    // TODO: 实现通知发送逻辑
  }

  console.warn('[SubscriptionMonitor] 订阅状态监控任务执行完毕');
}
