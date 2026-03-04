import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.DATABASE_URL = 'postgres://fake:fake@localhost:5432/fake';

import { LeadService } from '../lead.service';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import { leads, leadStatusHistory } from '@/shared/api/schema';

// Mock DB
vi.mock('@/shared/api/db', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      const tx = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([
          {
            id: 'lead-123',
            tenantId: 'tenant-1',
            status: 'PENDING_ASSIGNMENT',
            assignedSalesId: null,
            version: 1,
          },
        ]),
        update: vi.fn().mockImplementation((table) => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue(table === leads ? [] : [{ id: '*' }]), // Simulate lock failure for leads!
        })),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: '*' }]),
        })),
      };
      return await cb(tx);
    }),
  },
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    record: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('@/features/settings/actions/system-settings-actions', () => ({
  getSettingInternal: vi.fn().mockResolvedValue('NONE'),
}));

vi.mock('@/features/leads/logic/distribution-engine', () => ({
  distributeToNextSales: vi.fn().mockResolvedValue({ salesId: null }),
}));

describe('LeadService Concurrency & Optimistic Locking', () => {
  const mockTenantId = 'tenant-1';
  const mockSalesA = 'sales-user-A';
  const mockLeadId = 'lead-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[L1] should throw error when claimFromPool optimistic lock fails (returning 0 rows)', async () => {
    // [SCENARIO]: claimFromPool should accept version and throw if update returns no rows (or if select finds no lead because version mismatch).
    // For claimFromPool, we simulate `update(...).returning()` yielding empty array due to version mismatch or concurrent change.

    // Wait, current claimFromPool does not even accept version parameter!
    // We expect typescript to fail if we don't fix implementation, but let's test the lock bypass logic.
    // We will pass the version parameter when we fix it.
    // For the RED phase, we expect it to reject when we pass version and returning is empty.

    await expect(
      // We pass version = 1 (fourth parameter), but update returning gives [] -> should throw
      LeadService.claimFromPool(mockLeadId, mockTenantId, mockSalesA, 1 as any)
    ).rejects.toThrow('数据已被他人修改，请刷新后重试');
  });

  it('[L2] should throw error when releaseToPool optimistic lock fails (returning 0 rows)', async () => {
    // Mock `for('update')` to return a lead that is assigned, so releasing is permitted (if user is assigned sales)
    vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
      const tx: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        for: vi.fn().mockResolvedValue([
          {
            id: mockLeadId,
            tenantId: mockTenantId,
            status: 'PENDING_FOLLOWUP',
            assignedSalesId: mockSalesA,
            version: 1,
          },
        ]),
        update: vi.fn().mockImplementation((table) => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue(table === leads ? [] : [{ id: '*' }]), // Simulate LEADS lock failure!
        })),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
        })),
      };
      return await cb(tx);
    });

    // Current releaseToPool does NOT accept version parameter, and does NOT use .returning() checking!
    // We expect it to throw when lock fails after implementation fix.
    await expect(
      LeadService.releaseToPool(mockLeadId, mockTenantId, mockSalesA, false, 1 as any)
    ).rejects.toThrow('数据已被他人修改，请刷新后重试');
  });
});
