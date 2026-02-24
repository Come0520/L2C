import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '@/shared/services/audit-service';
import { db } from '@/shared/api/db';
import { updateRolePermissions } from '../role-management/actions';
import { updateWorker } from '../worker-management/actions';
import { updateMfaConfig } from '../tenant-settings/actions';
import { PERMISSIONS } from '@/shared/config/permissions';

// Mock 核心依赖
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            roles: { findFirst: vi.fn() },
            users: { findFirst: vi.fn() },
            tenants: { findFirst: vi.fn() },
        },
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(true),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue({
        user: { id: 'admin-1', tenantId: 'tenant-1', role: 'ADMIN', roles: ['ADMIN'] },
        expires: '2025-01-01',
    }),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('Audit Automation - 自动化审计日志校验', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('修改角色权限时，应当触发详细的审计日志', async () => {
        const mockRoleId = '550e8400-e29b-41d4-a716-446655440000';
        const newPermissions = [PERMISSIONS.LEAD.VIEW, PERMISSIONS.CUSTOMER.VIEW];

        // 模拟旧权限查询
        (db.query.roles.findFirst as any).mockResolvedValue({
            id: mockRoleId,
            permissions: [],
            isSystem: false,
            tenantId: 'tenant-1',
        });

        // 执行 Action
        await updateRolePermissions({ roleId: mockRoleId, permissions: newPermissions });

        // 验证结果
        expect(AuditService.log).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'UPDATE_ROLE_PERMISSIONS',
            tableName: 'roles',
            recordId: mockRoleId,
            newValues: expect.objectContaining({ permissions: newPermissions }),
        }));
    });

    it('禁用师傅账号时，应当记录旧状态和新状态', async () => {
        const mockWorkerId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
        // 模拟旧数据查询
        (db.query.users.findFirst as any).mockResolvedValue({
            id: mockWorkerId,
            name: '老张',
            isActive: true,
            tenantId: 'tenant-1',
        });

        await updateWorker({ id: mockWorkerId, isActive: false });

        expect(AuditService.log).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'DISABLE_WORKER',
            tableName: 'users',
            recordId: mockWorkerId,
            oldValues: expect.objectContaining({ isActive: true }),
            newValues: expect.objectContaining({ isActive: false }),
        }));
    });

    it('修改租户 MFA 配置时，应当记录安全策略变更', async () => {
        const mockTenantId = 'tenant-1';
        (db.query.tenants.findFirst as any).mockResolvedValue({
            id: mockTenantId,
            settings: { mfa: { enabled: false } },
        });

        await updateMfaConfig({ enabled: true, method: 'totp' });

        expect(AuditService.log).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'UPDATE_MFA_CONFIG',
            tableName: 'tenants',
            newValues: expect.objectContaining({
                mfa: expect.objectContaining({ enabled: true, method: 'totp' })
            }),
        }));
    });
});
