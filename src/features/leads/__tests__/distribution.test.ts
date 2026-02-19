
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureDistributionStrategy, distributeToNextSales, getDistributionStatus } from '../logic/distribution-engine';

// Hoist mockDb creation
const { mockDb } = vi.hoisted(() => {
    // Factory for independent mocks
    const createMockQuery = () => ({
        findFirst: vi.fn(),
        findMany: vi.fn(),
    });

    return {
        mockDb: {
            query: {
                leads: createMockQuery(),
                users: createMockQuery(),
                customers: createMockQuery(),
                leadStatusHistory: createMockQuery(),
                approvalFlows: createMockQuery(),
                tenants: createMockQuery(),
                // Add other tables as needed
            },
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue({}),
                }),
            }),
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        for: vi.fn().mockResolvedValue([]), // mock 'for update' chain
                    })
                })
            }),
            transaction: vi.fn((cb) => cb({
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            for: vi.fn().mockResolvedValue([]),
                        })
                    })
                }),
                query: {
                    leads: createMockQuery(),
                    users: createMockQuery(),
                    leadStatusHistory: createMockQuery(),
                    approvalFlows: createMockQuery(),
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue({})
                    })
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue({})
                }),
                delete: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue({})
                }),
            })),
        }
    };
});

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/features/settings/actions/system-settings-actions', () => ({
    getSetting: vi.fn(),
    getSettingInternal: vi.fn(),
}));

// Mock AuditService 以避免实际调用
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
        logBatch: vi.fn().mockResolvedValue(undefined),
    },
}));

import { auth, checkPermission } from '@/shared/lib/auth';
import { getSettingInternal } from '@/features/settings/actions/system-settings-actions';

describe('Distribution Engine', () => {
    const tenantId = 'test-tenant-id';

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue({ user: { id: 'admin', tenantId } });
        (getSettingInternal as any).mockResolvedValue('ROUND_ROBIN');
    });

    describe('configureDistributionStrategy', () => {
        it('should require authentication', async () => {
            (auth as any).mockResolvedValue(null);
            await expect(configureDistributionStrategy('MANUAL')).rejects.toThrow('Unauthorized');
        });

        it('should update tenant distribution config', async () => {
            mockDb.query.tenants.findFirst.mockResolvedValue({ settings: {} });

            await configureDistributionStrategy('ROUND_ROBIN', ['sales1']);

            expect(mockDb.update).toHaveBeenCalled();
            expect(checkPermission).toHaveBeenCalled();
        });
    });

    describe('distributeToNextSales', () => {
        it('should return MANUAL if strategy is manual', async () => {
            // Mock transaction select result (tenant)
            const mockTx = {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            // tenant found, strategy manual
                            for: vi.fn().mockResolvedValue([{ settings: { distribution: { strategy: 'MANUAL' } } }]),
                        })
                    })
                }),
                query: { users: { findMany: vi.fn() } },
            };
            mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
            (getSettingInternal as any).mockResolvedValue('MANUAL');

            const result = await distributeToNextSales(tenantId);
            expect(result.strategy).toBe('MANUAL');
            expect(result.salesId).toBeNull();
        });

        it('should distribute using ROUND_ROBIN', async () => {
            // Mock transaction select result (tenant)
            // select 被调用两次：
            // 1) tenant 配置查询（带 .for('update')）
            // 2) sales users 查询（返回数组）
            const selectMock = vi.fn();
            // 第一次 select: tenant 查询
            selectMock.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        for: vi.fn().mockResolvedValue([{ settings: { distribution: { strategy: 'ROUND_ROBIN', nextSalesIndex: 0 } } }]),
                    })
                })
            });
            // 第二次 select: sales users 查询
            selectMock.mockReturnValueOnce({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue([{ id: 'sales1', name: 'Sales One' }, { id: 'sales2', name: 'Sales Two' }])
                })
            });
            const mockTx = {
                select: selectMock,
                query: {
                    tenants: { findFirst: vi.fn() },
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue({}),
                    }),
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue({})
                }),
            };
            mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
            (getSettingInternal as any).mockResolvedValue('ROUND_ROBIN');

            const result = await distributeToNextSales(tenantId);

            expect(result.strategy).toBe('ROUND_ROBIN');
            expect(result.salesId).toBe('sales1'); // index 0 -> next is index 1? Or current index used? 
            // Logic: currentIndex = config.nextSalesIndex % length = 0.
            // nextSales = list[0] -> sales1.
            // newIndex = 1.
            // Wait, logic says: const nextSales = salesList[currentIndex];
            // So should be sales1.

            expect(result.salesId).toBe('sales1');
        });
    });
});
