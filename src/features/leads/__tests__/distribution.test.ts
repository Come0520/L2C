import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  configureDistributionStrategy,
  distributeToNextSales,
  getDistributionStatus,
} from '../logic/distribution-engine';

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
        // mock count for LOAD_BALANCE
        count: vi.fn(),
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
          }),
        }),
      }),
      transaction: vi.fn((cb) =>
        cb({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                for: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
          query: {
            leads: createMockQuery(),
            users: createMockQuery(),
            leadStatusHistory: createMockQuery(),
            approvalFlows: createMockQuery(),
          },
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue({}),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockResolvedValue({}),
          }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        })
      ),
    },
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
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin', tenantId } } as never);
    vi.mocked(getSettingInternal).mockResolvedValue('ROUND_ROBIN');
  });

  describe('configureDistributionStrategy', () => {
    it('should require authentication', async () => {
      vi.mocked(auth).mockResolvedValue(null);
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
              for: vi
                .fn()
                .mockResolvedValue([{ settings: { distribution: { strategy: 'MANUAL' } } }]),
            }),
          }),
        }),
        query: { users: { findMany: vi.fn() } },
      };
      mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
      vi.mocked(getSettingInternal).mockResolvedValue('MANUAL');

      const result = await distributeToNextSales(tenantId);
      expect(result.strategy).toBe('MANUAL');
      expect(result.salesId).toBeNull();
    });

    it('should distribute using ROUND_ROBIN', async () => {
      const selectMock = vi.fn();
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi
              .fn()
              .mockResolvedValue([
                { settings: { distribution: { strategy: 'ROUND_ROBIN', nextSalesIndex: 0 } } },
              ]),
          }),
        }),
      });
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'sales1', name: 'Sales One' },
            { id: 'sales2', name: 'Sales Two' },
          ]),
        }),
      });
      const mockTx = {
        select: selectMock,
        query: { tenants: { findFirst: vi.fn() } },
        update: vi
          .fn()
          .mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
          }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
      };
      mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
      vi.mocked(getSettingInternal).mockResolvedValue('ROUND_ROBIN');

      const result = await distributeToNextSales(tenantId);

      expect(result.strategy).toBe('ROUND_ROBIN');
      expect(result.salesId).toBe('sales1');
    });

    it('should distribute using LOAD_BALANCE to the sales with minimum active leads', async () => {
      const selectMock = vi.fn();
      // Tenant config
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi
              .fn()
              .mockResolvedValue([{ settings: { distribution: { strategy: 'LOAD_BALANCE' } } }]),
          }),
        }),
      });
      // Available sales users
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'sales1', name: 'Sales One' },
            { id: 'sales2', name: 'Sales Two' },
          ]),
        }),
      });
      // Mock db.select().from(leads).where(...) group by / count behavior
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue([
              { assignedSalesId: 'sales1', count: 5 },
              { assignedSalesId: 'sales2', count: 2 }, // sales2 has fewer leads
            ]),
          }),
        }),
      });

      const mockTx = {
        select: selectMock,
        update: vi
          .fn()
          .mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
          }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
      };
      mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
      vi.mocked(getSettingInternal).mockResolvedValue('LOAD_BALANCE');

      const result = await distributeToNextSales(tenantId);

      expect(result.strategy).toBe('LOAD_BALANCE');
      expect(result.salesId).toBe('sales2');
    });

    it('should distribute using CHANNEL_SPECIFIC to mapped sales user', async () => {
      const selectMock = vi.fn();
      // Tenant config with channelMapping
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([
              {
                settings: {
                  distribution: {
                    strategy: 'CHANNEL_SPECIFIC',
                    channelMapping: { 'channel-A': ['sales3', 'sales4'] },
                    channelPointers: { 'channel-A': 1 },
                  },
                },
              },
            ]),
          }),
        }),
      });
      // Global Available sales users
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'sales1', name: 'Sales One' },
            { id: 'sales2', name: 'Sales Two' },
            { id: 'sales3', name: 'Sales Three' },
            { id: 'sales4', name: 'Sales Four' },
          ]),
        }),
      });

      const mockTx = {
        select: selectMock,
        update: vi
          .fn()
          .mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
          }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
      };
      mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
      vi.mocked(getSettingInternal).mockResolvedValue('CHANNEL_SPECIFIC');

      // Now pass channelId as 3rd parameter to distributeToNextSales
      const result = await distributeToNextSales(tenantId, undefined, 'channel-A');

      expect(result.strategy).toBe('CHANNEL_SPECIFIC');
      // Pointer is 1, so it should pick 'sales4' from ['sales3', 'sales4']
      expect(result.salesId).toBe('sales4');
    });

    it('should fallback to ROUND_ROBIN if CHANNEL_SPECIFIC misses the mapping', async () => {
      const selectMock = vi.fn();
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            for: vi.fn().mockResolvedValue([
              {
                settings: {
                  distribution: {
                    strategy: 'CHANNEL_SPECIFIC',
                    channelMapping: { 'channel-A': ['sales3'] },
                    nextSalesIndex: 0,
                  },
                },
              },
            ]),
          }),
        }),
      });
      selectMock.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: 'sales1', name: 'Sales One' },
            { id: 'sales2', name: 'Sales Two' },
          ]),
        }),
      });

      const mockTx = {
        select: selectMock,
        update: vi
          .fn()
          .mockReturnValue({
            set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) }),
          }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
      };
      mockDb.transaction.mockImplementation(async (cb) => cb(mockTx));
      vi.mocked(getSettingInternal).mockResolvedValue('CHANNEL_SPECIFIC');

      // Note: Passing 'channel-B' which is not in the mapping
      const result = await distributeToNextSales(tenantId, undefined, 'channel-B');

      expect(result.strategy).toBe('ROUND_ROBIN'); // Reduced to round robin
      expect(result.salesId).toBe('sales1');
    });
  });

  describe('getDistributionStatus', () => {
    it('should return correct distribution status', async () => {
      mockDb.query.tenants.findFirst.mockResolvedValue({
        settings: { distribution: { strategy: 'ROUND_ROBIN', nextSalesIndex: 1 } },
      });
      mockDb.query.users.findMany.mockResolvedValue([
        { id: 'sales1', name: 'Sales One' },
        { id: 'sales2', name: 'Sales Two' },
      ]);

      const status = await getDistributionStatus();

      expect(status.strategy).toBe('ROUND_ROBIN');
      expect(status.salesPool.length).toBe(2);
      expect(status.nextSalesIndex).toBe(1);
      expect(status.nextSalesName).toBe('Sales Two');
    });

    it('should require authentication', async () => {
      vi.mocked(auth).mockResolvedValue(null);
      await expect(getDistributionStatus()).rejects.toThrow('Unauthorized');
    });
  });
});
