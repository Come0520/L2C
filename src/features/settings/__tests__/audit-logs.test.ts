import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuditLogsAction, getAuditTableNamesAction } from '../actions/audit-logs';

const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    dbSelect: vi.fn(),
    dbFrom: vi.fn(),
    dbLeftJoin: vi.fn(),
    dbWhere: vi.fn(),
    dbOrderBy: vi.fn(),
    dbLimit: vi.fn(),
    dbOffset: vi.fn(),
    dbSelectDistinct: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));

vi.mock('@/shared/api/db', () => {
    // Audit logs query chain
    const createQueryChain = () => ({
        from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            offset: vi.fn().mockResolvedValue([
                                {
                                    id: 'log-1',
                                    tableName: 'users',
                                    action: 'CREATE',
                                    userId: 'u1',
                                    createdAt: new Date(),
                                }
                            ])
                        })
                    })
                })
            }),
            where: vi.fn().mockResolvedValue([{ count: 1 }]) // For count query
        })
    });

    const createDistinctChain = () => ({
        from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([{ tableName: 'users' }, { tableName: 'orders' }])
            })
        })
    });

    return {
        db: {
            select: vi.fn((arg) => {
                if (arg && 'count' in arg) {
                    return {
                        from: vi.fn().mockReturnValue({
                            where: vi.fn().mockResolvedValue([{ count: 1 }])
                        })
                    };
                }
                return createQueryChain();
            }),
            selectDistinct: vi.fn(() => createDistinctChain()),
        }
    };
});

describe('Audit Logs Actions', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-456';
    const mockSession = { user: { id: mockUserId, tenantId: mockTenantId } };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    describe('getAuditLogsAction', () => {
        it('should return paginated audit logs successfully', async () => {
            const result = await getAuditLogsAction({
                page: 1,
                pageSize: 20
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.logs.length).toBe(1);
                expect(result.data.pagination.total).toBe(1);
                expect(result.data.logs[0].tableName).toBe('users');
            }
        });

        it('should apply filters to the query', async () => {
            const result = await getAuditLogsAction({
                page: 1,
                pageSize: 20,
                tableName: 'users',
                action: 'UPDATE',
                search: 'query',
            });
            expect(result.success).toBe(true);
        });

        it('should handle unauthenticated user', async () => {
            mocks.auth.mockResolvedValue(null);
            const result = await getAuditLogsAction({ page: 1, pageSize: 20 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('未授权访问');
            }
        });

        it('should enforce permission check', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('Unauthorized'));
            const result = await getAuditLogsAction({ page: 1, pageSize: 20 });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Unauthorized');
            }
        });
    });

    describe('getAuditTableNamesAction', () => {
        it('should return distinct table names', async () => {
            const result = await getAuditTableNamesAction();
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.length).toBe(2);
                expect(result.data).toContain('users');
                expect(result.data).toContain('orders');
            }
        });

        it('should enforce permission check', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('Unauthorized'));
            const result = await getAuditTableNamesAction();
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('Unauthorized');
            }
        });
    });
});
