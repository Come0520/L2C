/**
 * 租户设置模块测试
 *
 * 覆盖 tenant-settings/actions.ts 的全部 4 个导出函数：
 * - getTenantInfo：获取租户基本信息
 * - getMfaConfig：获取 MFA 配置
 * - updateTenantInfo：更新租户基本信息（Zod 校验 + 审计日志）
 * - updateMfaConfig：更新 MFA 配置（settings jsonb 合并 + 审计日志）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getTenantInfo,
    getMfaConfig,
    updateTenantInfo,
    updateMfaConfig,
} from '../tenant-settings/actions';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';

// ===== Mock 依赖 =====
import { AdminRateLimiter } from '../rate-limiter';

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('../rate-limiter', () => ({
    AdminRateLimiter: {
        check: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    },
}));

// 数据库 Mock
const mockDbFindFirstTenants = vi.fn().mockResolvedValue(null);
const mockDbUpdateReturning = vi.fn().mockResolvedValue([{ id: 'tenant-id' }]);

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            tenants: {
                findFirst: (...args: any[]) => mockDbFindFirstTenants(...args),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: mockDbUpdateReturning,
                })),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// ===== 测试常量 =====

const TENANT_ID = '11111111-1111-4111-a111-111111111111';
const USER_ID = '33333333-3333-4333-a333-333333333333';

const makeSession = (tenantId = TENANT_ID) => ({
    user: { id: USER_ID, role: 'ADMIN', tenantId, name: '管理员' },
});

const MOCK_TENANT = {
    id: TENANT_ID,
    name: '测试租户',
    logoUrl: 'https://example.com/logo.png',
    applicantName: '张三',
    applicantPhone: '13800138000',
    applicantEmail: 'test@example.com',
    region: '华东',
    status: 'active',
    createdAt: new Date('2026-01-01'),
    settings: null,
};

const mockAuth = vi.mocked(auth);
const mockCheckPermission = vi.mocked(checkPermission);
const mockAuditLog = vi.mocked(AuditService.log);

// =============================================================
// 测试套件
// =============================================================

describe('Tenant Settings 模块测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCheckPermission.mockResolvedValue(true as never);
        mockDbFindFirstTenants.mockResolvedValue(null);
    });

    // ==========================================
    // 1. getTenantInfo
    // ==========================================
    describe('getTenantInfo', () => {
        it('应成功返回租户基本信息', async () => {
            mockDbFindFirstTenants.mockResolvedValue(MOCK_TENANT);
            const session = makeSession();
            const result = await getTenantInfo(session as never);
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.name).toBe('测试租户');
            expect(result.data!.applicantPhone).toBe('13800138000');
        });

        it('租户不存在应返回错误', async () => {
            mockDbFindFirstTenants.mockResolvedValue(null);
            const session = makeSession();
            const result = await getTenantInfo(session as never);
            expect(result.success).toBe(false);
            expect(result.error).toContain('租户不存在');
        });

        it('无权限应返回错误', async () => {
            mockCheckPermission.mockRejectedValue(new Error('权限不足'));
            const session = makeSession();
            const result = await getTenantInfo(session as never);
            expect(result.success).toBe(false);
            expect(result.error).toContain('权限不足');
        });

        it('返回数据应包含所有必要字段', async () => {
            mockDbFindFirstTenants.mockResolvedValue(MOCK_TENANT);
            const session = makeSession();
            const result = await getTenantInfo(session as never);
            expect(result.data).toHaveProperty('id');
            expect(result.data).toHaveProperty('name');
            expect(result.data).toHaveProperty('logoUrl');
            expect(result.data).toHaveProperty('applicantName');
            expect(result.data).toHaveProperty('applicantPhone');
            expect(result.data).toHaveProperty('applicantEmail');
            expect(result.data).toHaveProperty('region');
            expect(result.data).toHaveProperty('status');
            expect(result.data).toHaveProperty('createdAt');
        });
    });

    // ==========================================
    // 2. getMfaConfig
    // ==========================================
    describe('getMfaConfig', () => {
        it('应返回已配置的 MFA 信息', async () => {
            mockDbFindFirstTenants.mockResolvedValue({
                settings: {
                    mfa: { enabled: true, applicableRoles: ['ADMIN'], method: 'totp' },
                },
            });
            const session = makeSession();
            const result = await getMfaConfig(session as never);
            expect(result.success).toBe(true);
            expect(result.data!.enabled).toBe(true);
            expect(result.data!.applicableRoles).toEqual(['ADMIN']);
            expect(result.data!.method).toBe('totp');
        });

        it('settings 为 null 时应返回默认值', async () => {
            mockDbFindFirstTenants.mockResolvedValue({ settings: null });
            const session = makeSession();
            const result = await getMfaConfig(session as never);
            expect(result.success).toBe(true);
            expect(result.data!.enabled).toBe(false);
            expect(result.data!.applicableRoles).toEqual([]);
            expect(result.data!.method).toBe('totp');
        });

        it('settings.mfa 不存在时应返回默认值', async () => {
            mockDbFindFirstTenants.mockResolvedValue({ settings: {} });
            const session = makeSession();
            const result = await getMfaConfig(session as never);
            expect(result.success).toBe(true);
            expect(result.data!.enabled).toBe(false);
        });

        it('租户不存在应返回错误', async () => {
            mockDbFindFirstTenants.mockResolvedValue(null);
            const session = makeSession();
            const result = await getMfaConfig(session as never);
            expect(result.success).toBe(false);
            expect(result.error).toContain('租户不存在');
        });

        it('无权限应返回错误', async () => {
            mockCheckPermission.mockRejectedValue(new Error('权限不足'));
            const session = makeSession();
            const result = await getMfaConfig(session as never);
            expect(result.success).toBe(false);
        });
    });

    // ==========================================
    // 3. updateTenantInfo
    // ==========================================
    describe('updateTenantInfo', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await updateTenantInfo({ name: '新名称' });
            expect(result.success).toBe(false);
        });

        it('合法参数应成功更新', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue(MOCK_TENANT);
            mockDbUpdateReturning.mockResolvedValue([{ ...MOCK_TENANT, name: '新名称' }]);
            const result = await updateTenantInfo({ name: '新名称' });
            expect(result.success).toBe(true);
        });

        it('更新后应记录审计日志', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue(MOCK_TENANT);
            mockDbUpdateReturning.mockResolvedValue([{ ...MOCK_TENANT, name: '新名称' }]);
            await updateTenantInfo({ name: '新名称' });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'UPDATE',
                    tableName: 'tenants',
                }),
            );
        });

        it('name 超过 100 字符应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const longName = 'A'.repeat(101);
            const result = await updateTenantInfo({ name: longName });
            expect(result.success).toBe(false);
        });

        it('name 为空字符串应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateTenantInfo({ name: '' });
            expect(result.success).toBe(false);
        });

        it('手机号格式错误应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateTenantInfo({ applicantPhone: '12345' });
            expect(result.success).toBe(false);
        });

        it('合法手机号应通过校验', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue(MOCK_TENANT);
            mockDbUpdateReturning.mockResolvedValue([{ ...MOCK_TENANT }]);
            const result = await updateTenantInfo({ applicantPhone: '13912345678' });
            expect(result.success).toBe(true);
        });

        it('邮箱格式错误应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateTenantInfo({ applicantEmail: 'not-an-email' });
            expect(result.success).toBe(false);
        });

        it('logoUrl 非 URL 格式应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateTenantInfo({ logoUrl: 'not-a-url' as any });
            expect(result.success).toBe(false);
        });
    });

    // ==========================================
    // 4. updateMfaConfig
    // ==========================================
    describe('updateMfaConfig', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null as never);
            const result = await updateMfaConfig({ enabled: true });
            expect(result.success).toBe(false);
        });

        it('启用 MFA 应成功', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue({ settings: {} });
            mockDbUpdateReturning.mockResolvedValue([{ id: TENANT_ID }]);
            const result = await updateMfaConfig({
                enabled: true,
                method: 'totp',
                applicableRoles: ['ADMIN'],
            });
            expect(result.success).toBe(true);
        });

        it('禁用 MFA 应成功', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue({
                settings: { mfa: { enabled: true, method: 'totp', applicableRoles: [] } },
            });
            mockDbUpdateReturning.mockResolvedValue([{ id: TENANT_ID }]);
            const result = await updateMfaConfig({ enabled: false });
            expect(result.success).toBe(true);
        });

        it('更新 MFA 应记录审计日志', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue({ settings: { mfa: { enabled: false } } });
            mockDbUpdateReturning.mockResolvedValue([{ id: TENANT_ID }]);
            await updateMfaConfig({ enabled: true, method: 'sms' });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'UPDATE_MFA_CONFIG',
                    tableName: 'tenants',
                }),
            );
        });

        it('审计日志应包含旧值和新值', async () => {
            const oldMfa = { enabled: false, applicableRoles: [], method: 'totp' };
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue({ settings: { mfa: oldMfa } });
            mockDbUpdateReturning.mockResolvedValue([{ id: TENANT_ID }]);
            await updateMfaConfig({ enabled: true, method: 'sms', applicableRoles: ['ADMIN'] });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    oldValues: expect.objectContaining({ mfa: oldMfa }),
                    newValues: expect.objectContaining({
                        mfa: expect.objectContaining({ enabled: true, method: 'sms' }),
                    }),
                }),
            );
        });

        it('method 不在枚举范围内应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateMfaConfig({ enabled: true, method: 'invalid' as any });
            expect(result.success).toBe(false);
        });

        it('settings 为 null 时应能合并新 MFA 配置', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue({ settings: null });
            mockDbUpdateReturning.mockResolvedValue([{ id: TENANT_ID }]);
            const result = await updateMfaConfig({ enabled: true });
            expect(result.success).toBe(true);
        });

        it('租户不存在应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstTenants.mockResolvedValue(null);
            const result = await updateMfaConfig({ enabled: true });
            expect(result.success).toBe(false);
        });
    });
});
