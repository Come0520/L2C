import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    revalidatePath: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));

vi.mock('next/cache', () => ({
    revalidatePath: mocks.revalidatePath,
    revalidateTag: vi.fn(),
}));

import { createSplitRule, updateSplitRule, deleteSplitRule } from '../split-rules/actions';

describe('SplitRulesActions', () => {
    const mockSession = {
        user: { id: 'user-1', tenantId: 'tenant-1', role: 'ADMIN' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
    });

    describe('createSplitRule', () => {
        it('拥有权限时应成功执行', async () => {
            mocks.checkPermission.mockResolvedValue(true);
            const result = await createSplitRule({ data: { name: 'Test Rule' } });
            expect(result.success).toBe(true);
            expect(result.data?.message).toContain('simulated');
            expect(mocks.checkPermission).toHaveBeenCalled();
        });

        it('权限不足时应返回错误', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('权限限制'));
            const result = await createSplitRule({});
            expect(result.success).toBe(false);
            expect(result.error).toContain('权限限制');
        });
    });

    describe('updateSplitRule', () => {
        it('拥有权限时应成功执行', async () => {
            mocks.checkPermission.mockResolvedValue(true);
            const result = await updateSplitRule({ id: 'rule-1', data: { name: 'Updated Rule' } });
            expect(result.success).toBe(true);
            expect(result.data?.message).toContain('simulated');
            expect(mocks.checkPermission).toHaveBeenCalled();
        });
    });

    describe('deleteSplitRule', () => {
        it('拥有权限时应成功执行并清除缓存', async () => {
            mocks.checkPermission.mockResolvedValue(true);
            const result = await deleteSplitRule({ id: 'rule-1' });
            expect(result.success).toBe(true);
            expect(result.data?.message).toContain('simulated');
            expect(mocks.revalidatePath).toHaveBeenCalledWith('/settings/split-rules');
        });
    });
});
