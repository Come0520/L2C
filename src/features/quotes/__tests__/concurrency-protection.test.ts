import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';
import { preflightVersionCheck } from '../actions/shared-helpers';
import { createQuoteActionInternal } from '../actions/quote-crud';

/**
 * 并发保护测试
 * 验证基于 version 字段的乐观锁机制
 */
describe('报价单并发保护测试', () => {
    const mockTenantId = 'test-tenant-id';
    const mockUserId = 'test-user-id';
    const mockCustomerId = 'test-customer-id';

    it('版本号不匹配时应阻断更新 (乐观锁验证)', async () => {
        // 1. 准备测试数据 (直接使用 Action 或 DB 创建)
        const [quote] = await db.insert(quotes).values({
            customerId: mockCustomerId,
            tenantId: mockTenantId,
            createdBy: mockUserId,
            name: '并发测试报价',
            version: 1
        }).returning();

        expect(quote.version).toBe(1);

        // 2. 模拟用户 A 成功更新，版本号变更为 2
        await db.update(quotes)
            .set({ version: 2, name: '用户 A 的改动' })
            .where(and(eq(quotes.id, quote.id), eq(quotes.tenantId, mockTenantId)));

        // 3. 模拟用户 B 持有旧版本号 (1) 尝试操作
        await expect(preflightVersionCheck(quote.id, mockTenantId, 1))
            .rejects.toThrow('CONCURRENCY_CONFLICT');
    });

    it('未提供版本号时应跳过检查 (兼容性)', async () => {
        const [quote] = await db.insert(quotes).values({
            customerId: 'customer-2',
            tenantId: mockTenantId,
            createdBy: mockUserId,
            name: '无版本检查测试',
            version: 1
        }).returning();

        // 不传版本号应正常通过 (preflightVersionCheck 的设计逻辑是在 undefined 时不抛异常)
        await expect(preflightVersionCheck(quote.id, mockTenantId, undefined))
            .resolves.not.toThrow();
    });
});
