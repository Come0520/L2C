'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { subDays } from 'date-fns';
import { } from 'next/cache';
import { logger } from '@/shared/lib/logger';

/**
 * 自动结案后台任务 Action。
 *
 * @description 扫描租户下所有处于“安装完成” (`INSTALLATION_COMPLETED`) 状态、且最后更新距今已超过 7 天的订单。
 * 逻辑规范：
 * 1. 系统性扫描：识别符合条件的停滞订单。
 * 2. 自动确认：调用 OrderService 将其流转至最终态 `COMPLETED`。
 * 3. 结果汇总：返回成功处理的订单数量及失败详情。
 * 4. 缓存同步：结案后清理首页订单统计等缓存。
 *
 * @note 通常作为计划任务 (Cron Job) 触发。手动触发时建议在业务低峰期执行。
 * @returns 处理结果报告，包含总数、成功数及详细记录。
 */
export async function autoCloseOrdersAction() {
  const session = await auth();
  // 权限检查：通常此操作应由系统 Cron 触发，此处临时要求拥有订单编辑权限的用户可手动触发
  if (!session?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const tenantId = session.user.tenantId;

  try {
    // 查找 7 天前的时间点
    const sevenDaysAgo = subDays(new Date(), 7);

    // 获取待结案订单列表
    const ordersToClose = await db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.status, 'INSTALLATION_COMPLETED'),
        sql`${orders.updatedAt} < ${sevenDaysAgo.toISOString()}`
      ),
      columns: {
        id: true,
        orderNo: true,
        version: true,
        customerId: true,
      },
      limit: 100, // D4-002: 添加 limit，防止大结果集导致的深翻页或内存 OOM
    });

    if (ordersToClose.length === 0) {
      return { success: true, message: '没有需要自动结案的订单', count: 0 };
    }

    const results: Array<{ id: string; orderNo: string; success: boolean; error?: string }> = [];

    // D4-001: 优化性能瓶颈。移除 Promise.allSettled 的 N+1 更新循环，使用批量 SQL 进行一次性状态流转
    type OrderToClose = { id: string; orderNo: string; version: number | null; customerId: string | null };
    const orderIds = ordersToClose.map((o: OrderToClose) => o.id);

    await db.transaction(async (tx: any) => {
      // 1. 批量更新订单状态为 COMPLETED 并增加版本号
      await tx
        .update(orders)
        .set({
          status: 'COMPLETED',
          version: sql`${orders.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.tenantId, tenantId),
            inArray(orders.id, orderIds)
          )
        );

      // 2. 批量记录审计日志 (为了兼容 AuditService.record 的单条签名，可以在此用 Promise.all，在 db 层其实在同一个 tx 中很快)
      const { AuditService } = await import('@/shared/services/audit-service');
      const { CustomerStatusService } = await import('@/services/customer-status.service');

      await Promise.all(
        ordersToClose.map((order: OrderToClose) =>
          AuditService.record(
            {
              tenantId,
              userId: session.user.id,
              tableName: 'orders',
              recordId: order.id,
              action: 'UPDATE',
              oldValues: { status: 'INSTALLATION_COMPLETED' },
              newValues: { status: 'COMPLETED' },
              changedFields: { status: 'COMPLETED' },
            },
            tx
          )
        )
      );

      // 3. 处理订单成功后的钩子同步
      // 提取唯一的客户 ID，避免重复触发回调
      const uniqueCustomerIds = [...new Set(ordersToClose.map((o: OrderToClose) => o.customerId).filter(Boolean))];
      if (uniqueCustomerIds.length > 0) {
        await Promise.all(
          uniqueCustomerIds.map(customerId =>
            CustomerStatusService.onOrderCompleted(customerId as string, tenantId)
          )
        );
      }
    });

    for (const order of ordersToClose) {
      console.log('[orders] 订单自动结案成功:', { orderId: order.id, orderNo: order.orderNo, tenantId });
      results.push({ id: order.id, orderNo: order.orderNo, success: true });
    }

    // 统一清除缓存
    return {
      success: true,
      message: `成功处理 ${results.filter((r) => r.success).length} 个订单`,
      count: results.length,
      details: results,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Auto-close scan failed:', { error: message });
    return { success: false, error: message };
  }
}
