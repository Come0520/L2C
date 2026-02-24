import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as wxLoginHandler } from '../auth/wx-login/route';
import { POST as createOrderHandler } from '../orders/route';
import { GET as dashboardHandler } from '../dashboard/route';
import { db } from '@/shared/api/db';
import { IdempotencyGuard, RateLimiter } from '@/shared/services/miniprogram/security.service';
import { CacheService } from '@/shared/services/miniprogram/cache.service';
import * as authUtils from '../auth-utils';

function createReq(url: string, body?: unknown, method = 'POST'): NextRequest {
    return new NextRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
}

// Global Mocks required for E2E Flow Simulation
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() },
            tenants: { findFirst: vi.fn() },
            quotes: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
            salesTargets: { findFirst: vi.fn() },
            customers: { findMany: vi.fn() },
            orders: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
        },
        select: vi.fn().mockReturnValue({
            from: function () { return this; },
            where: function () { return this; },
            groupBy: function () { return this; },
            then: function (resolve: (value: unknown) => void) {
                // 提供通用的 fallback 返回
                resolve([{ total: '1000', count: 10, status: 'WON' }]);
            }
        }),
        transaction: vi.fn(async (cb) => {
            const tx = {
                insert: vi.fn(() => ({
                    values: vi.fn(() => ({
                        returning: vi.fn().mockResolvedValue([{ id: 'mock-order-uuid', orderNo: 'ORD-123' }])
                    }))
                })),
                update: vi.fn(() => ({
                    set: vi.fn(() => ({
                        where: vi.fn().mockResolvedValue({})
                    }))
                })),
                query: {
                    orders: { findFirst: vi.fn().mockResolvedValue({ id: 'mock-order-uuid', paidAmount: '0', totalAmount: '1000' }) }
                }
            };
            return await cb(tx);
        }),
    }
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('../auth-utils', async () => {
    const actual = await vi.importActual('../auth-utils');
    return {
        ...(actual as Record<string, unknown>),
        getMiniprogramUser: vi.fn().mockResolvedValue({ id: 'u1', tenantId: 't1', role: 'sales' }),
        generateMiniprogramToken: vi.fn().mockResolvedValue('mock-token'),
        generateRegisterToken: vi.fn().mockResolvedValue('mock-register-token'),
        verifyRegisterToken: vi.fn().mockResolvedValue({ openId: 'test-openid' }),
    };
});

// Avoid explicit delays
vi.mock('node:timers/promises', () => ({
    setTimeout: vi.fn().mockResolvedValue(undefined),
}));

describe('军工级联调与破坏性用例 (E2E & Chaos)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 重置所有安全阈值和缓存以防止上古状态污染当前断言
        CacheService.flushAll();
        // Since RateLimiter has no flushAll out of box, we just rely on keys being distinct per test or reset manually
        RateLimiter.reset('create_order_u1');
    });

    describe('1. 防刷单与频控 (Rate Limiter) 拦截测试', () => {
        it('应允许合理频率的 API 调用并拦截毫秒级的恶意疯狂重放（429）', async () => {
            // Setup DB mock to pass schema validator
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({
                id: '550e8400-e29b-41d4-a716-446655440000', status: 'ORDERED', customerId: 'c1', totalAmount: '1000', items: []
            } as never);

            // 发起第一次建单 (成功抢占 Rate Limit Bucket)
            const req1 = createReq('http://localhost/api/orders', { quoteId: '550e8400-e29b-41d4-a716-446655440000' });
            const res1 = await createOrderHandler(req1);
            expect(res1.status).toBe(200);

            // 毫无延迟下发起第二次和第三次和第四次 (应被令牌桶拦住)
            const req2 = createReq('http://localhost/api/orders', { quoteId: 'b0a7d57d-f43c-47ea-8d6d-2c3f8f1c8e23' });
            const res2 = await createOrderHandler(req2);
            const req3 = createReq('http://localhost/api/orders', { quoteId: '695d71c1-4b71-41e9-867c-3f417f7d3c3d' });
            const res3 = await createOrderHandler(req3);
            const req4 = createReq('http://localhost/api/orders', { quoteId: 'a3b8c9d0-e1f2-43b4-85d6-c7e8f9a0b1c2' });
            const res4 = await createOrderHandler(req4);
            const req5 = createReq('http://localhost/api/orders', { quoteId: 'd4e5f6a7-b8c9-40d1-a2b3-c4d5e6f7a8b9' });
            const res5 = await createOrderHandler(req5);

            // 因设定的漏桶算法通常是 3 次或特定阈值，前面的可能成功，但第 4 或 5 次必须 429
            const statuses = [res2.status, res3.status, res4.status, res5.status];
            expect(statuses).toContain(429);
        });
    });

    describe('2. 极致并发抢占 (Idempotency) 脏数据隔离测试', () => {
        it('单用户针对同一个 Quote 并发连击 5 次，必须只流转成功 1 次并立刻封锁其他请求且保证不产生错误插库', async () => {
            // 重置以便获取全新的配额
            RateLimiter.reset('create_order_u1');

            // 增加 DB 事务操作延迟，以诱导并发时可能发生的漏网竞态条件
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
                await new Promise(resolve => setTimeout(resolve, 50)); // 人工延迟放大竞争缺口
                const tx = {
                    insert: vi.fn(() => ({
                        values: vi.fn(() => ({
                            returning: vi.fn().mockResolvedValue([{ id: 'mock-order-uuid', orderNo: 'ORD-RACE' }])
                        }))
                    })),
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn().mockResolvedValue({})
                        }))
                    })),
                    query: {
                        orders: { findFirst: vi.fn().mockResolvedValue({ id: 'mock-order-uuid', paidAmount: '0', totalAmount: '1000' }) }
                    }
                };
                return await cb(tx);
            });

            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({
                id: 'f8e9d0c1-b2a3-44d5-8e6f-7a8b9c0d1e2f', status: 'ORDERED', customerId: 'c1', totalAmount: '1000', items: []
            } as never);

            // 同时平行开火 3 发同样的有效请求
            const requests = [
                createOrderHandler(createReq('http://localhost/api/orders', { quoteId: 'f8e9d0c1-b2a3-44d5-8e6f-7a8b9c0d1e2f' })),
                createOrderHandler(createReq('http://localhost/api/orders', { quoteId: 'f8e9d0c1-b2a3-44d5-8e6f-7a8b9c0d1e2f' })),
                createOrderHandler(createReq('http://localhost/api/orders', { quoteId: 'f8e9d0c1-b2a3-44d5-8e6f-7a8b9c0d1e2f' })),
            ];

            const responses = await Promise.all(requests);
            const statusCodes = responses.map((r: Response) => r.status);

            // 断言: 必定只有一个返回 200，其余被判定为 409 (PROCESSING conflict) 或 429
            const successCount = statusCodes.filter((c: number) => c === 200).length;
            const conflictCount = statusCodes.filter((c: number) => c === 409).length;

            expect(successCount).toBe(1);
            expect(conflictCount).toBeGreaterThanOrEqual(1);

            // 断言 DB Transaction (创建账单及详单) 严格只被调用了一次
            expect(db.transaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('3. 聚合查询极限缓存 (LRU Cache) 阻击测试', () => {
        it('高频读取 Dashboard 时应该只查一次 DB，其余走内存缓冲，且速度差异显著', async () => {
            // 初始化复杂耗时 DB 模拟 
            vi.mocked(db.select).mockReturnValue({
                from: function () { return this; },
                where: function () { return this; },
                groupBy: function () { return this; },
                then: function (resolve: (val: unknown) => void) {
                    // 人为制造 20 毫秒的 SQL 响应延迟供 LRU Cache 断言检测
                    setTimeout(() => resolve([{ status: 'WON', count: 10 }]), 20);
                }
            } as never);

            const req = new NextRequest('http://localhost/api/dashboard', { method: 'GET' });

            // 第一笔查询 (穿透并写缓存)
            const t0 = performance.now();
            const res1 = await dashboardHandler(req);
            const t1 = performance.now();
            expect(res1.status).toBe(200);

            // 第二笔查询 (由于存在缓存，不会触发 db.select，时间必须极短)
            const t2 = performance.now();
            const res2 = await dashboardHandler(req);
            const t3 = performance.now();
            expect(res2.status).toBe(200);

            const durationFirst = t1 - t0;
            const durationSecond = t3 - t2;

            // 第二次的时间应当指数级短于第一次
            expect(durationSecond).toBeLessThan(durationFirst);

            // 校验由于 LRU 机制阻挡，高频并发下的聚合查询下穿次数只有 1 层 
            // （注意：因为除了 groupBy，上面还有 salesTarget，为泛化断言直接检查 db.select 的总体调用情况是否稳定）
            // 在两次请求下，因为缓存覆盖，DB 的访问总次数必定一致
            const selectCallsPhase1 = vi.mocked(db.select).mock.calls.length;
            await dashboardHandler(req);
            const selectCallsPhase2 = vi.mocked(db.select).mock.calls.length;
            expect(selectCallsPhase1).toBe(selectCallsPhase2);
        });
    });
});
