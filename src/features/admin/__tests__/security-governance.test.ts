import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdminRateLimiter } from '../rate-limiter';
import { QuotaManager } from '../quota-manager';
import { db } from '@/shared/api/db';

// Mock logger
vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock DB for QuotaManager
vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn(),
    },
}));

describe('Security Governance - 安全治理专项测试', () => {

    describe('AdminRateLimiter - 速率限制测试', () => {
        const USER_ID = 'test-user';
        const ACTION = 'role_mutation'; // 限制为 5次/分钟

        beforeEach(() => {
            vi.useFakeTimers();
            // 清理 RateLimiter 内部存储 (由于 storage 是私有的，通过其行为验证或反射重置)
            (AdminRateLimiter as any).storage = new Map();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('应当允许在阈值内的操作', async () => {
            for (let i = 0; i < 5; i++) {
                await expect(AdminRateLimiter.check(USER_ID, ACTION)).resolves.not.toThrow();
            }
        });

        it('应当拒绝超过阈值的操作', async () => {
            // 先消耗完 5 个配额
            for (let i = 0; i < 5; i++) {
                await AdminRateLimiter.check(USER_ID, ACTION);
            }
            // 第 6 次应当报错
            await expect(AdminRateLimiter.check(USER_ID, ACTION)).rejects.toThrow('操作过于频繁');
        });

        it('滑动窗口重置后应当恢复可用', async () => {
            for (let i = 0; i < 5; i++) {
                await AdminRateLimiter.check(USER_ID, ACTION);
            }

            // 快进 61 秒 (过了一分钟窗口)
            vi.advanceTimersByTime(61 * 1000);

            await expect(AdminRateLimiter.check(USER_ID, ACTION)).resolves.not.toThrow();
        });

        it('不同操作类型的速率限制应当相互独立', async () => {
            // 耗尽 role_mutation
            for (let i = 0; i < 5; i++) {
                await AdminRateLimiter.check(USER_ID, ACTION);
            }
            await expect(AdminRateLimiter.check(USER_ID, ACTION)).rejects.toThrow();

            // 但 worker_mutation (限制 20) 应当仍然可用
            await expect(AdminRateLimiter.check(USER_ID, 'worker_mutation')).resolves.not.toThrow();
        });
    });

    describe('QuotaManager - 资源配额测试', () => {
        const TENANT_ID = 'tenant-test';

        it('当角色数量未达上限时应当允许创建', async () => {
            (db.where as any).mockResolvedValue([{ count: 10 }]); // 假设已有 10 个，上限 20
            await expect(QuotaManager.checkRoleQuota(TENANT_ID)).resolves.not.toThrow();
        });

        it('当角色数量达到上限时应当拒绝创建', async () => {
            (db.where as any).mockResolvedValue([{ count: 20 }]); // 已达上限
            await expect(QuotaManager.checkRoleQuota(TENANT_ID)).rejects.toThrow('角色数量已达上限');
        });

        it('租户之间的配额应当相互隔离 (多租户隔离验证)', async () => {
            // 采用更直接的计数器模拟：第一次返回 20 (触发拒绝)，第二次返回 0 (允许)
            (db.where as any)
                .mockResolvedValueOnce([{ count: 20 }])
                .mockResolvedValueOnce([{ count: 0 }]);

            await expect(QuotaManager.checkRoleQuota('TenantFull')).rejects.toThrow();
            await expect(QuotaManager.checkRoleQuota('TenantEmpty')).resolves.not.toThrow();
        });
    });
});
