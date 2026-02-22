/**
 * Search 模块安全与功能测试
 * 覆盖 Auth 保护、Zod 校验、TenantId 隔离、以及高亮、Redis 历史记录、范围控制
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalSearch } from '../actions';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { redis } from '@/shared/lib/redis';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            customers: { findMany: vi.fn().mockResolvedValue([]) },
            leads: { findMany: vi.fn().mockResolvedValue([]) },
            orders: { findMany: vi.fn().mockResolvedValue([]) },
        },
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/shared/lib/redis', () => ({
    redis: {
        lrange: vi.fn(),
        lrem: vi.fn(),
        lpush: vi.fn(),
        ltrim: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
}));

// ===== 常量 =====

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeSession = (tenantId = TENANT_A) => ({
    user: { id: USER_ID, role: 'ADMIN', roles: ['ADMIN'], tenantId, name: '测试用户' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Search 模块 L5 升级测试 (globalSearch)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Auth与鉴权保护', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await globalSearch({ query: '测试' });
            expect(result.success).toBe(false);
        });

        it('关键词超长触发 Zod 校验失败', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await globalSearch({ query: 'a'.repeat(101) });
            expect(result.success).toBe(false);
            expect(result.data).toBeUndefined(); // Zod 报错无 data 返回
        });
    });

    describe('功能特性：历史记录、与空查询', () => {
        it('空关键词返回搜索历史 (history) 且不触发 db', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            vi.mocked(redis?.lrange as any).mockResolvedValue(['history-1', 'history-2']);

            const result = await globalSearch({ query: '' });

            expect(result.success).toBe(true);
            expect(result.data?.history).toHaveLength(2);
            expect(result.data?.history[0].label).toBe('history-1');
            expect(db.query.customers.findMany).not.toHaveBeenCalled();
        });
    });

    describe('功能特性：实际搜索、高亮、租户隔离与范围控制', () => {
        it('带关键词搜索时触发数据库查询并记录历史，tenantId 正确隔离', async () => {
            mockAuth.mockResolvedValue(makeSession(TENANT_A) as never);
            vi.mocked(db.query.customers.findMany as any).mockResolvedValue([
                { id: 'c1', name: 'Alibaba', phone: '123' },
            ]);

            const result = await globalSearch({ query: 'Alibaba', scope: 'all' });

            expect(result.success).toBe(true);
            expect(result.data?.customers).toHaveLength(1);
            expect(result.data?.customers[0].highlight?.label).toBe('<mark>Alibaba</mark>');

            // 验证 db 查询被调用
            expect(db.query.customers.findMany).toHaveBeenCalled();
            // 验证 redis 历史记录写入 (key 为 search:history:{tenantId}:{userId})
            expect(redis?.lpush).toHaveBeenCalledWith(`search:history:${TENANT_A}:${USER_ID}`, 'Alibaba');
        });

        it('限制 limit 参数正确生效', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            await globalSearch({ query: 'limit text', limit: 3 });
            expect(db.query.customers.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 3 })
            );
        });

        it('空结果测试：数据库未命中任何数据时应返回空数组结构', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            vi.mocked(db.query.customers.findMany as any).mockResolvedValue([]);
            vi.mocked(db.query.leads.findMany as any).mockResolvedValue([]);
            vi.mocked(db.query.orders.findMany as any).mockResolvedValue([]);

            const result = await globalSearch({ query: '不存在的内容', scope: 'all' });

            expect(result.success).toBe(true);
            expect(result.data?.customers).toHaveLength(0);
            expect(result.data?.leads).toHaveLength(0);
            expect(result.data?.orders).toHaveLength(0);
        });

        it('特殊字符注入测试：带正则特殊字符的搜索应正常工作不应抛出异常', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const weirdQuery = '^*()\\.+?[]{}|\\$';
            vi.mocked(db.query.customers.findMany as any).mockResolvedValue([
                { id: 'c1', name: `Test ${weirdQuery} Name`, phone: '123' },
            ]);

            const result = await globalSearch({ query: weirdQuery, scope: 'customers' });

            expect(result.success).toBe(true);
            expect(result.data?.customers).toHaveLength(1);
            // 验证生成的 highlight 不抛异常，且包含了原文（高亮函数中的正则表达式正确转义）
            expect(result.data?.customers[0].highlight?.label).toContain('<mark>');
        });

        it('Redis 降级测试：当 Redis 客户端抛异常或不存在时，必须静默降级且不影响数据库搜索响应', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            vi.mocked(redis?.lpush as any).mockRejectedValue(new Error('Redis connection failed'));
            vi.mocked(db.query.customers.findMany as any).mockResolvedValue([
                { id: 'cdown', name: 'Alibaba', phone: '123' },
            ]);

            // Redis 异常可能会抛出，但为了高可用，通常可以把操作放在独立 trycatch，
            // 若当前 actions.ts 未能吞噬 redis 异常，此用例可能失败或提醒我们需要补充 try-catch。
            // 预期：搜索依然成功并返回客户数据
            const result = await globalSearch({ query: 'Alibaba' });

            if (result.success === false) {
                // 如果目前代码会抛出异常，这是重构点。在这里记录测试以便引导后续可能所需的 bugfix
                // 我们假设代码已经能扛得住或我们期望它扛得住
            }
            // 为了安全起见这里暂时用标准验证（如果代码未catch，测试用例会直接失败被捕获）
            expect(result.success).toBe(true);
            expect(result.data?.customers).toHaveLength(1);
        });
    });
});
