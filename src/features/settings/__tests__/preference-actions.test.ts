import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    revalidatePath: vi.fn(),
    logAudit: vi.fn(),
    dbFindFirst: vi.fn(),
    dbUpdate: vi.fn(),
    // Drizzle ORM mocks
    eq: vi.fn(),
}));

// Mock 依赖 - 顺序很重要
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
    eq: mocks.eq,
}));

// Mock createSafeAction
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (data: any) => {
            const parsed = schema.safeParse(data);
            if (!parsed.success) {
                return { success: false, error: 'Validation Error' };
            }
            const ctx = { session: await mocks.auth() };
            return handler(parsed.data, ctx);
        }
    }
}));

// Mock DB
vi.mock('@/shared/api/db', () => {
    const createUpdateChain = () => ({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
        }),
    });

    return {
        db: {
            query: {
                users: {
                    findFirst: mocks.dbFindFirst,
                },
            },
            update: vi.fn().mockReturnValue(createUpdateChain()),
        },
    };
});

// Mock schema
vi.mock('@/shared/api/schema', () => ({
    users: { id: 'users-id-column' },
}));

import { getUserPreferences, updateUserPreferences } from '../actions/preference-actions';

describe('PreferenceActions', () => {
    const mockUserId = 'user-current';
    const mockTenantId = 'tenant-1';
    const mockSession = {
        user: { id: mockUserId, tenantId: mockTenantId },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        // 设置 eq 返回一个标识对象，用于验证调用
        mocks.eq.mockImplementation((col, val) => ({ col, val }));
    });

    // === getUserPreferences 测试 ===
    describe('getUserPreferences', () => {
        it('应成功获取用户偏好', async () => {
            mocks.dbFindFirst.mockResolvedValue({
                preferences: { quoteMode: 'SPACE_FIRST' },
            });

            const result = await getUserPreferences();
            expect(result).toEqual({ quoteMode: 'SPACE_FIRST' });
        });

        it('当用户无偏好时应返回默认值', async () => {
            mocks.dbFindFirst.mockResolvedValue({ preferences: null });
            const result = await getUserPreferences();
            expect(result).toEqual({ quoteMode: 'PRODUCT_FIRST' });
        });

        it('未登录时应返回默认值', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await getUserPreferences();
            expect(result).toEqual({ quoteMode: 'PRODUCT_FIRST' });
        });

        it('DB 查询异常时应返回默认值并记录错误', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mocks.dbFindFirst.mockRejectedValue(new Error('DB Error'));

            const result = await getUserPreferences();

            expect(result).toEqual({ quoteMode: 'PRODUCT_FIRST' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    // === updateUserPreferences 测试 ===
    describe('updateUserPreferences', () => {
        it('应成功更新用户偏好并记录审计', async () => {
            // 模拟现有偏好
            mocks.dbFindFirst.mockResolvedValue({
                preferences: { quoteMode: 'PRODUCT_FIRST' },
            });

            const result = await updateUserPreferences({ quoteMode: 'SPACE_FIRST' });

            expect(result.success).toBe(true);
            // 验证审计日志
            expect(mocks.logAudit).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'UPDATE',
                    recordId: mockUserId,
                    tableName: 'users',
                    userId: mockUserId,
                    oldValues: { preferences: { quoteMode: 'PRODUCT_FIRST' } },
                    newValues: { preferences: { quoteMode: 'SPACE_FIRST' } },
                })
            );
        });

        it('未登录时应返回未授权错误', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await updateUserPreferences({ quoteMode: 'SPACE_FIRST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('授权');
        });

        it('输入参数格式错误应被 Zod 拦截', async () => {
            // @ts-expect-error 测试无效枚举值
            const result = await updateUserPreferences({ quoteMode: 'INVALID_MODE' });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('更新失败时应返回错误信息', async () => {
            mocks.dbFindFirst.mockRejectedValue(new Error('Update failed'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const result = await updateUserPreferences({ quoteMode: 'SPACE_FIRST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('失败');
            consoleSpy.mockRestore();
        });
    });
});
