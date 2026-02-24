import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createEmployeeInviteLink,
    createCustomerInviteLink,
    validateInviteToken,
    registerEmployee,
    registerCustomer
} from '../actions/invite';

const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    generateEmployeeInviteLink: vi.fn(),
    generateCustomerInviteLink: vi.fn(),
    verifyInviteToken: vi.fn(),
    registerEmployeeByInvite: vi.fn(),
    registerCustomerByInvite: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));

vi.mock('@/shared/lib/invite-token', () => ({
    generateEmployeeInviteLink: mocks.generateEmployeeInviteLink,
    generateCustomerInviteLink: mocks.generateCustomerInviteLink,
    verifyInviteToken: mocks.verifyInviteToken,
    registerEmployeeByInvite: mocks.registerEmployeeByInvite,
    registerCustomerByInvite: mocks.registerCustomerByInvite,
}));

vi.mock('next/cache', () => ({
    revalidatePath: mocks.revalidatePath,
    revalidateTag: vi.fn(),
}));

describe('Invite Actions', () => {
    const mockSession = { user: { id: 'u1', tenantId: 't1' } };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    describe('createEmployeeInviteLink', () => {
        it('should create link successfully', async () => {
            mocks.generateEmployeeInviteLink.mockResolvedValue('https://link.test');
            const result = await createEmployeeInviteLink(['admin']);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.link).toBe('https://link.test');
            }
        });

        it('should handle unauthenticated session', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await createEmployeeInviteLink();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('未授权');
            }
        });

        it('should handle unauthorized user', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('Unauthorized'));
            const result = await createEmployeeInviteLink();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('无权限邀请员工');
            }
        });

        it('should handle link generation error', async () => {
            mocks.generateEmployeeInviteLink.mockRejectedValue(new Error('Gen error'));
            const result = await createEmployeeInviteLink();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('生成邀请链接失败');
            }
        });
    });

    describe('createCustomerInviteLink', () => {
        it('should create link successfully', async () => {
            mocks.generateCustomerInviteLink.mockResolvedValue('https://cust.link');
            const result = await createCustomerInviteLink('c1');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.link).toBe('https://cust.link');
            }
        });

        it('should handle unauthenticated session', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await createCustomerInviteLink('c1');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('未授权');
            }
        });

        it('should handle link generation error', async () => {
            mocks.generateCustomerInviteLink.mockRejectedValue(new Error('Gen error'));
            const result = await createCustomerInviteLink('c1');
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('生成邀请链接失败');
            }
        });
    });

    describe('validateInviteToken', () => {
        it('should validate correctly', async () => {
            mocks.verifyInviteToken.mockResolvedValue({ valid: true });
            const result = await validateInviteToken('token');
            expect(result).toEqual({ valid: true });
        });

        it('should handle verification failure', async () => {
            mocks.verifyInviteToken.mockRejectedValue(new Error('Invalid token'));
            const result = await validateInviteToken('invalid-token');
            expect(result).toEqual({ valid: false, error: '令牌验证失败' });
        });
    });

    describe('registerEmployee', () => {
        const mockUserData = {
            name: 'Test',
            phone: '123',
            password: 'password123'
        };

        it('should register successfully', async () => {
            mocks.registerEmployeeByInvite.mockResolvedValue({ success: true, userId: 'u2' });
            const result = await registerEmployee('token', mockUserData);
            expect(result.success).toBe(true);
            expect(mocks.revalidatePath).toHaveBeenCalledWith('/settings/users');
        });

        it('should handle validation error', async () => {
            const result = await registerEmployee('token', { ...mockUserData, password: '123' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('输入数据格式错误');
            }
        });
    });

    describe('registerCustomer', () => {
        const mockUserData = {
            name: 'Test Cust',
            phone: '321',
            password: 'password123'
        };

        it('should register sequence correctly', async () => {
            mocks.registerCustomerByInvite.mockResolvedValue({ success: true, customerId: 'c2' });
            const result = await registerCustomer('token', mockUserData);
            expect(result.success).toBe(true);
            expect(mocks.revalidatePath).toHaveBeenCalledWith('/customers');
        });

        it('should handle schema validation error', async () => {
            const result = await registerCustomer('token', { ...mockUserData, phone: '' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toContain('输入数据格式错误');
            }
        });
    });
});
