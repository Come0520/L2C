import { describe, it, expect } from 'vitest';
import { getTicketDetail } from '../actions/ticket';
import { db } from '@/shared/api/db';
import { eq } from 'drizzle-orm';
import { afterSalesTickets } from '@/shared/api/schema';
import { auth } from '@/shared/lib/auth';

/**
 * P1-1 性能基准测试
 * 用于复现售后详情页 getTicketDetail 加载慢的问题
 */
describe('Performance: getTicketDetail', () => {
  it('should load ticket detail within 500ms', async () => {
    // 1. 寻找一个真实的工单 ID
    const ticketInfo = await db.query.afterSalesTickets.findFirst({
      columns: { id: true, tenantId: true },
    });

    if (!ticketInfo) {
      console.log('No ticket found in db, skipping performance test');
      return;
    }

    // 2. 模拟 auth session 环境，以便通过 action 内部租户隔离校验
    const mockAuth = require('@/shared/lib/auth');
    mockAuth.auth = async () => ({
      user: { id: 'test-user', tenantId: ticketInfo.tenantId },
    });

    // 3. 执行测试并记录时间
    const start = performance.now();
    const result = await getTicketDetail(ticketInfo.id);
    const end = performance.now();

    const duration = end - start;
    console.log(`⏱️ getTicketDetail duration: ${duration.toFixed(2)}ms`);

    // 基础断言
    expect(result.success).toBe(true);
    // 性能断言 (必须要在一定时间内返回)
    expect(duration).toBeLessThan(500);
  });
});
