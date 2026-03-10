import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';
import { saveRoleOverride, saveAllRoleOverrides } from '../role-override-actions';
import { db } from '@/shared/api/db';
import * as authLib from '@/shared/lib/auth';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

const mockWhere = vi.fn().mockReturnThis();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockInsert = vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]) })) }));
const mockTx = {
    update: mockUpdate,
    insert: mockInsert,
    query: {
        roleOverrides: {
            findFirst: vi.fn()
        }
    }
};

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            roles: {
                findFirst: vi.fn(),
            },
            roleOverrides: {
                findFirst: vi.fn(),
            }
        },
        transaction: vi.fn(async (cb) => cb(mockTx)),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    unstable_cache: vi.fn((cb) => cb),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/config/permissions', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/config/permissions')>();
    return {
        ...actual,
        getAllPermissions: vi.fn().mockReturnValue(['perm1', 'perm2']),
    };
});

vi.mock('@/shared/lib/role-permission-service', () => ({
    RolePermissionService: {
        getTenantRoleOverrides: vi.fn().mockResolvedValue({}),
    }
}));

// Mock drizzle-orm to capture and assert SQL conditions
vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
        ...actual,
        eq: vi.fn((col: any, val: any) => ({ type: 'eq', colName: col?.name || 'unknown', val })),
        and: vi.fn((...args: any[]) => ({ type: 'and', args })),
    };
});

describe('Role Override Actions (Settings) - D3-006 TOCTOU Fix', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authLib.auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(authLib.checkPermission).mockResolvedValue(true);
    });

    describe('saveRoleOverride', () => {
        it('MUST include tenantId in the UPDATE roleOverrides WHERE clause (D3-006 TOCTOU)', async () => {
            // Arrange
            const roleCode = 'SALES';

            // Mock db.query.roles.findFirst to simulate role is valid in the tenant
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                id: 'role-123',
                tenantId: MOCK_TENANT_ID,
                code: roleCode,
                name: 'Sales',
            } as any);

            // Mock tx.query.roleOverrides.findFirst to simulate an existing override (UPDATE path)
            mockTx.query.roleOverrides.findFirst.mockResolvedValueOnce({
                id: 'override-123',
                tenantId: MOCK_TENANT_ID,
                roleCode,
                addedPermissions: [],
                removedPermissions: [],
            } as any);

            // Act
            const result = await saveRoleOverride(roleCode, ['perm1'], []);

            // Assert
            expect(result.success).toBe(true);
            expect(mockUpdate).toHaveBeenCalled();

            const whereArg = mockWhere.mock.calls[0][0];

            // Assert that we used 'and' with eq checks for both id and tenantId
            expect(whereArg).toEqual({
                type: 'and',
                args: expect.arrayContaining([
                    { type: 'eq', colName: 'id', val: 'override-123' },
                    { type: 'eq', colName: 'tenant_id', val: MOCK_TENANT_ID }
                ])
            });
        });
    });

    describe('saveAllRoleOverrides', () => {
        it('MUST include tenantId in the UPDATE roleOverrides WHERE clause for batch save (D3-006 TOCTOU)', async () => {
            // Arrange
            const overrides = [
                { roleCode: 'SALES', addedPermissions: ['perm1'], removedPermissions: [] }
            ];

            // Simulate existing override for UPDATE
            mockTx.query.roleOverrides.findFirst.mockResolvedValue({
                id: 'override-123',
                tenantId: MOCK_TENANT_ID,
                roleCode: 'SALES',
            } as any);

            // Act
            const result = await saveAllRoleOverrides(overrides);

            // Assert
            expect(result.success).toBe(true);
            const whereArg = mockWhere.mock.calls[0][0];
            expect(whereArg).toEqual({
                type: 'and',
                args: expect.arrayContaining([
                    { type: 'eq', colName: 'id', val: 'override-123' },
                    { type: 'eq', colName: 'tenant_id', val: MOCK_TENANT_ID }
                ])
            });
        });
    });
});
