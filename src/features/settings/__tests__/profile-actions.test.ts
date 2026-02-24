import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    revalidatePath: vi.fn(),
    logAudit: vi.fn(),
    dbFindFirst: vi.fn(),
    dbUpdate: vi.fn(),
    eq: vi.fn(),
    ne: vi.fn(),
    and: vi.fn(),
    compare: vi.fn(),
    hash: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
}));
vi.mock('next/cache', () => ({
    revalidatePath: mocks.revalidatePath,
    revalidateTag: vi.fn(),
}));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));
vi.mock('drizzle-orm', () => ({
    eq: mocks.eq,
    ne: mocks.ne,
    and: mocks.and,
}));
vi.mock('bcryptjs', () => ({
    compare: mocks.compare,
    hash: mocks.hash,
}));

// Mock createSafeAction
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: <T extends z.ZodTypeAny, R>(schema: T, handler: (data: z.infer<T>, ctx: { session: { user: { id: string, tenantId: string } } }) => Promise<R>) => {
        return async (data: unknown) => {
            const parsed = schema.safeParse(data);
            if (!parsed.success) {
                const error = parsed.error.issues[0]?.message || '验证失败';
                return { success: false, error };
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
            update: vi.fn().mockImplementation(createUpdateChain),
        },
    };
});

// Mock schema
vi.mock('@/shared/api/schema', () => ({
    users: { id: 'users-id-column', phone: 'users-phone-column' },
}));

import { updateProfile, changePassword } from '../actions/profile-actions';

describe('ProfileActions', () => {
    const mockUserId = 'user-123';
    const mockTenantId = 'tenant-456';
    const mockSession = {
        user: { id: mockUserId, tenantId: mockTenantId },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.eq.mockImplementation((col, val) => ({ type: 'eq', col, val }));
        mocks.ne.mockImplementation((col, val) => ({ type: 'ne', col, val }));
        mocks.and.mockImplementation((...args) => ({ type: 'and', args }));
        mocks.hash.mockResolvedValue('hashed-new-password');
    });

    describe('updateProfile', () => {
        const updateData = {
            name: 'New Name',
            phone: '13800138000',
            image: 'https://example.com/avatar.jpg'
        };

        it('应成功更新个人信息并记录审计', async () => {
            // Promise.all: 先调 currentUser（users.id），再调 existingUser（phone check）
            mocks.dbFindFirst
                .mockResolvedValueOnce({ id: mockUserId, name: 'Old Name' }) // currentUser
                .mockResolvedValueOnce(null); // existingUser phone check（null = 无冲突）

            const result = await updateProfile(updateData);

            expect(result.success).toBe(true);
            expect(mocks.logAudit).toHaveBeenCalled();
            expect(mocks.revalidatePath).toHaveBeenCalledWith('/profile');
        });

        it('手机号冲突时应返回错误', async () => {
            // currentUser 需要先存在，然后 existingUser（phone check）返回冲突用户
            mocks.dbFindFirst
                .mockResolvedValueOnce({ id: mockUserId, name: 'Old Name' }) // currentUser
                .mockResolvedValueOnce({ id: 'other-user', phone: '13800138000' }); // phone conflict

            const result = await updateProfile(updateData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('手机号已被其他用户使用');
        });

        it('未登录时应被拦截', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await updateProfile(updateData);
            expect(result.success).toBe(false);
            expect(result.error).toContain('未授权');
        });
    });

    describe('changePassword', () => {
        const passwordData = {
            oldPassword: 'old-password-123',
            newPassword: 'new-password-456',
            confirmPassword: 'new-password-456'
        };

        it('应成功修改密码', async () => {
            mocks.dbFindFirst.mockResolvedValue({
                id: mockUserId,
                passwordHash: 'old-hashed-password'
            });
            mocks.compare.mockResolvedValue(true);

            const result = await changePassword(passwordData);

            expect(result.success).toBe(true);
            expect(mocks.hash).toHaveBeenCalledWith(passwordData.newPassword, 10);
            expect(mocks.logAudit).toHaveBeenCalled();
        });

        it('旧密码错误时应返回错误', async () => {
            mocks.dbFindFirst.mockResolvedValue({
                id: mockUserId,
                passwordHash: 'old-hashed-password'
            });
            mocks.compare.mockResolvedValue(false);

            const result = await changePassword(passwordData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('旧密码错误');
        });

        it('新旧密码相同时应被 Zod 拦截', async () => {
            const samePasswordData = {
                oldPassword: 'same-password-123',
                newPassword: 'same-password-123',
                confirmPassword: 'same-password-123'
            };

            const result = await changePassword(samePasswordData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('新密码不能与旧密码相同');
        });

        it('确认密码不一致应被 Zod 拦截', async () => {
            const mismatchData = {
                oldPassword: 'old-password-123',
                newPassword: 'new-password-456',
                confirmPassword: 'mismatch-123'
            };

            const result = await changePassword(mismatchData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('两次输入的新密码不一致');
        });
    });
});
