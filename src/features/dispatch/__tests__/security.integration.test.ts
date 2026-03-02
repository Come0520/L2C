import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignMeasureWorker, assignInstallWorker } from '../actions/dispatch-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

const MOCK_TENANT_A = 'tenant-A';
const MOCK_TENANT_B = 'tenant-B';
const MOCK_USER_A = 'user-A';

// Mock dependencies
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    record: vi.fn(),
    recordFromSession: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Dispatch Actions Security Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('assignMeasureWorker', () => {
    it('should reject if no active session', async () => {
      (auth as any).mockResolvedValueOnce(null);
      await expect(assignMeasureWorker('task-1', 'worker-1')).rejects.toThrow('未授权访问');
    });

    it('should reject if worker does not belong to the same tenant', async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
      });
      // Mock worker not found in tenant A
      (db.query.users.findFirst as any).mockResolvedValueOnce(null);

      await expect(assignMeasureWorker('task-1', 'worker-1')).rejects.toThrow(
        '目标工人不存在或不属于当前租户'
      );
    });

    it('should safely assign worker with tenantId isolated query', async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
      });
      // Mock worker found in tenant A
      (db.query.users.findFirst as any).mockResolvedValueOnce({
        id: 'worker-1',
        tenantId: MOCK_TENANT_A,
      });

      // Mock DB update returning success
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'task-1' }]),
          }),
        }),
      });
      (db.update as any) = updateMock;

      const result = await assignMeasureWorker('task-1', 'worker-1');

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-1');
      expect(db.update).toHaveBeenCalled();
    });

    it('should reject cross-tenant task assignment attempt', async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
      });
      (db.query.users.findFirst as any).mockResolvedValueOnce({
        id: 'worker-1',
        tenantId: MOCK_TENANT_A,
      });

      // Mock DB update returning NO rows (meaning the task wasn't found due to tenantId mismatch in where-clause)
      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          // simulates that `where(and(eq(id, taskId), eq(tenantId, currentTenantId)))` failed
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.update as any) = updateMock;

      await expect(assignMeasureWorker('task-B-1', 'worker-1')).rejects.toThrow(
        '测量任务不存在或无权限修改'
      );
    });
  });

  describe('assignInstallWorker', () => {
    it('should reject cross-tenant installation task assignment attempt', async () => {
      (auth as any).mockResolvedValueOnce({
        user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_B },
      });
      (db.query.users.findFirst as any).mockResolvedValueOnce({
        id: 'installer-1',
        tenantId: MOCK_TENANT_B,
      });

      const updateMock = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.update as any) = updateMock;

      await expect(assignInstallWorker('task-A-1', 'installer-1')).rejects.toThrow(
        '安装任务不存在或无权限修改'
      );
    });
  });
});
