import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSession } from '@/shared/tests/mock-factory';
import { updateUser } from '../user-actions';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import * as authLib from '@/shared/lib/auth';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

// Mock Drizzle queries
const mockWhere = vi.fn().mockReturnThis();
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));
const mockTx = { update: mockUpdate };

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: {
                findFirst: vi.fn(),
                findMany: vi.fn().mockResolvedValue([]),
            },
        },
        transaction: vi.fn(async (cb) => cb(mockTx)),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([]),
            })),
        })),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn(),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// Mock drizzle-orm to easily assert SQL conditions
vi.mock('drizzle-orm', async (importOriginal) => {
    const actual = await importOriginal<typeof import('drizzle-orm')>();
    return {
        ...actual,
        eq: vi.fn((col: any, val: any) => ({ type: 'eq', colName: col?.name || 'unknown', val })),
        and: vi.fn((...args: any[]) => ({ type: 'and', args })),
        ne: vi.fn((col: any, val: any) => ({ type: 'ne', colName: col?.name || 'unknown', val })),
        isNull: vi.fn((col: any) => ({ type: 'isNull', colName: col?.name || 'unknown' })),
    };
});

describe('User Actions (Settings) - D3-006 TOCTOU Fix', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(authLib.auth).mockResolvedValue(MOCK_SESSION);
        vi.mocked(authLib.checkPermission).mockResolvedValue(true);
    });

    describe('updateUser', () => {
        it('MUST include tenantId in the UPDATE WHERE clause (D3-006 TOCTOU)', async () => {
            // Arrange
            const targetUserId = 'target-user-123';

            // Mock findFirst to simulate user exists in our tenant
            vi.mocked(db.query.users.findFirst).mockResolvedValueOnce({
                id: targetUserId,
                name: 'Old Name',
                tenantId: MOCK_TENANT_ID,
                isActive: true,
                roles: ['USER'],
                role: 'USER',
            } as Record<string, unknown>);

            // Act
            const result = await updateUser(targetUserId, {
                name: 'New Name',
                roles: ['USER'],
                isActive: true,
            });

            // Assert
            expect(result.success).toBe(true);
            expect(mockUpdate).toHaveBeenCalled();

            const whereArg = mockWhere.mock.calls[0][0];

            // If the fix is applied, whereArg should be an 'and' object containing both 'eq' checks for id and tenantId
            expect(whereArg).toEqual({
                type: 'and',
                args: expect.arrayContaining([
                    { type: 'eq', colName: 'id', val: targetUserId },
                    { type: 'eq', colName: 'tenant_id', val: MOCK_TENANT_ID }
                ])
            });
        });
    });
});
