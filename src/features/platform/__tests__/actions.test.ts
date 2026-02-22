/**
 * Platform 模块安全测试
 * 覆盖 Auth 保护（平台管理员校验）、审计日志
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPendingTenants, approveTenant, rejectTenant } from '../actions/admin-actions';
import { submitTenantApplication } from '../actions/tenant-registration';
import { auth } from '@/shared/lib/auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn().mockResolvedValue(null),
                findMany: vi.fn().mockResolvedValue([]),
            },
            tenants: {
                findMany: vi.fn().mockResolvedValue([]),
                findFirst: vi.fn().mockResolvedValue(null),
            },
        },
        execute: vi.fn().mockResolvedValue([{ count: 0 }]),
        transaction: vi.fn(async (fn: Function) => fn({
            query: { tenants: { findFirst: vi.fn().mockResolvedValue({ status: 'pending_approval' }) } },
            update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
            insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'tenant-1' }]) })) })),
        })),
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([]) })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { record: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/services/wechat-subscribe-message.service', () => ({
    notifyTenantApproved: vi.fn().mockResolvedValue(undefined),
    notifyTenantRejected: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/lib/email', () => ({
    sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('bcryptjs', () => ({
    hash: vi.fn().mockResolvedValue('hashed-password'),
}));

vi.mock('nanoid', () => ({
    nanoid: vi.fn(() => 'TESTCODE'),
}));

// ===== 常量 =====

const USER_ID = '33333333-3333-3333-3333-333333333333';

const makeAdminSession = () => ({
    user: { id: USER_ID, role: 'PLATFORM_ADMIN', tenantId: 'platform', name: '超管' },
});

const mockAuth = vi.mocked(auth);

// ===== 测试套件 =====

describe('Platform 模块安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPendingTenants - 权限保护', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await getPendingTenants();
            expect(result.success).toBe(false);
        });

        it('非平台管理员应返回 success: false', async () => {
            mockAuth.mockResolvedValue({ user: { id: USER_ID } } as never);
            // isPlatformAdmin = false
            const { db } = await import('@/shared/api/db');
            vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({ isPlatformAdmin: false } as never);
            const result = await getPendingTenants();
            expect(result.success).toBe(false);
        });
    });

    describe('submitTenantApplication - Zod 校验', () => {
        it('无效手机号应返回错误', async () => {
            const result = await submitTenantApplication({
                companyName: '测试企业',
                applicantName: '张三',
                phone: '12345', // 无效
                email: 'test@example.com',
                password: 'Pass1234',
                region: '杭州',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('手机号');
        });

        it('密码过短应返回错误', async () => {
            const result = await submitTenantApplication({
                companyName: '测试企业',
                applicantName: '张三',
                phone: '13800138000',
                email: 'test@example.com',
                password: '123', // 过短
                region: '杭州',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('密码');
        });
    });
});
