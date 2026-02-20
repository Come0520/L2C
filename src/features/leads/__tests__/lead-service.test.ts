import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeadService } from '@/services/lead.service';
import { db } from '@/shared/api/db';
import { distributeToNextSales } from '@/features/leads/logic/distribution-engine';
import { getSettingInternal } from '@/features/settings/actions/system-settings-actions';

// Mock DB & Dependencies
vi.mock('@/shared/api/db', () => {
    const mockReturnSelf = vi.fn().mockReturnThis();
    const mockQueryBuilder = {
        set: mockReturnSelf,
        where: mockReturnSelf,
        returning: vi.fn().mockResolvedValue([{ id: 'updated' }]),
        execute: vi.fn().mockResolvedValue([{ id: 'updated' }]),
        then: function (resolve: (val: unknown) => void) { resolve([{ id: 'updated' }]); }
    };

    return {
        db: {
            query: {
                leads: { findFirst: vi.fn(), findMany: vi.fn() },
                customers: { findFirst: vi.fn() },
                users: { findFirst: vi.fn() }
            },
            transaction: vi.fn((cb) => {
                return cb({
                    query: {
                        leads: { findFirst: vi.fn(), findMany: vi.fn() },
                        customers: { findFirst: vi.fn() },
                        users: { findFirst: vi.fn() }
                    },
                    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([]) })) })),
                    update: vi.fn(() => mockQueryBuilder),
                    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: vi.fn().mockResolvedValue([]) })) })) })),
                });
            })
        }
    };
});

vi.mock('@/features/leads/logic/distribution-engine', () => ({
    distributeToNextSales: vi.fn()
}));

vi.mock('@/features/leads/logic/scoring', () => ({
    calculateLeadScore: vi.fn(() => 50)
}));

vi.mock('@/features/settings/actions/system-settings-actions', () => ({
    getSetting: vi.fn(),
    getSettingInternal: vi.fn()
}));

describe('LeadService', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-123';
    const mockLeadId = 'lead-123';

    beforeEach(() => {
        vi.clearAllMocks();

        // 默认系统设置 Mock
        vi.mocked(getSettingInternal).mockImplementation(async (key: string) => {
            if (key === 'LEAD_DUPLICATE_STRATEGY') return 'NONE';
            if (key === 'LEAD_AUTO_ASSIGN_RULE') return 'ROUND_ROBIN';
            return null;
        });
    });

    describe('createLead', () => {
        it('should create a lead successfully with auto-distribution', async () => {
            const input = {
                customerName: 'Test Customer',
                customerPhone: '13800000000',
                channelId: 'channel-1',
            };

            // Mock Deduplication Check (None found)
            const tx = {
                query: { leads: { findFirst: vi.fn().mockResolvedValue(null) }, customers: { findFirst: vi.fn().mockResolvedValue(null) } },
                insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: mockLeadId, ...input, score: 50, status: 'PENDING_FOLLOWUP' }]) }) }),
                update: vi.fn(() => ({
                    set: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    then: function (resolve: (val: unknown) => void) { resolve([{ id: 'updated' }]); }
                }))
            };
            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as never));

            // Mock Auto-distribute
            vi.mocked(distributeToNextSales).mockResolvedValue({ salesId: 'sales-1', salesName: 'Sales 1' } as never);

            const result = await LeadService.createLead(input as never, mockTenantId, mockUserId);

            expect(result.lead).toBeDefined();
            expect(result.isDuplicate).toBe(false);
            expect(distributeToNextSales).toHaveBeenCalled();
            expect(tx.insert).toHaveBeenCalledTimes(1);
        });

        it('should detect phone duplicate', async () => {
            // 开启消重策略
            vi.mocked(getSettingInternal).mockResolvedValue('AUTO_LINK');

            const input = { customerPhone: '13800000000' };

            // Mock Found Duplicate
            const tx = {
                query: {
                    leads: { findFirst: vi.fn().mockResolvedValue({ id: 'existing-id', tenantId: mockTenantId }) },
                    customers: { findFirst: vi.fn().mockResolvedValue(null) } // Needed if code checks customer too
                },
                insert: vi.fn(),
                update: vi.fn(() => ({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), then: (r: (val: unknown) => void) => r([]) }))
            };
            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(tx as never));

            const result = await LeadService.createLead(input as never, mockTenantId, mockUserId);
            if (!result.isDuplicate) console.error('Duplicate detection failed. Result:', result);

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateReason).toBe('PHONE');
        });
    });

    describe('getLead', () => {
        it('should return lead if found and tenant matches', async () => {
            // Service implementation uses db.query.leads.findFirst directly (not transactional)
            vi.mocked(db.query.leads.findFirst).mockResolvedValue({ id: mockLeadId, tenantId: mockTenantId } as never);

            const result = await LeadService.getLead(mockLeadId, mockTenantId);
            expect(result).toBeDefined();
            expect(result?.id).toBe(mockLeadId);
        });

        it('should return null if tenant mismatch', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue(null);

            const result = await LeadService.getLead(mockLeadId, 'other-tenant');
            expect(result).toBeNull();
        });
    });

    describe('claimFromPool', () => {
        it('should claim successfully', async () => {
            const mockLead = { id: mockLeadId, tenantId: mockTenantId, assignedSalesId: null, status: 'PENDING_ASSIGNMENT' };
            const mockTx = {
                select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ for: vi.fn().mockResolvedValue([mockLead]) }) }) }),
                update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ ...mockLead, assignedSalesId: mockUserId, status: 'PENDING_FOLLOWUP' }]) }) }) }),
                insert: vi.fn().mockReturnValue({ values: vi.fn() })
            };
            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx as never));

            const result = await LeadService.claimFromPool(mockLeadId, mockTenantId, mockUserId);
            expect(result.assignedSalesId).toBe(mockUserId);
            expect(result.status).toBe('PENDING_FOLLOWUP');
        });

        it('should throw if already assigned', async () => {
            const mockLead = { id: mockLeadId, tenantId: mockTenantId, assignedSalesId: 'other-sales' };
            const mockTx = {
                select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ for: vi.fn().mockResolvedValue([mockLead]) }) }) })
            };
            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx as never));

            await expect(LeadService.claimFromPool(mockLeadId, mockTenantId, mockUserId))
                .rejects.toThrow('线索不是待分配状态或已被认领');
        });
    });

    describe('convertLead', () => {
        it('should convert lead successfully', async () => {
            const mockTx = {
                query: { leads: { findFirst: vi.fn().mockResolvedValue({ id: mockLeadId, tenantId: mockTenantId }) } },
                select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ for: vi.fn().mockResolvedValue([{ id: mockLeadId, tenantId: mockTenantId, customerName: 'Test', customerPhone: '138', assignedSalesId: 'sales-1', status: 'FOLLOWING_UP', estimatedAmount: '0', channelId: null }]) }) }) }),
                insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'new-customer-id' }]) }) }),
                update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) })
            };
            vi.mocked(db.transaction).mockImplementation(async (cb) => cb(mockTx as never));

            const customerId = await LeadService.convertLead(mockLeadId, undefined, mockTenantId, mockUserId);
            expect(customerId).toBe('new-customer-id');
            expect(mockTx.update).toHaveBeenCalled(); // Update lead status to WON
        });
    });
});
