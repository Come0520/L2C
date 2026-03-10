import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateMeasureTaskStatus, updateInstallTaskStatus } from '../actions/dispatch-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';

const MOCK_TENANT_A = 'tenant-A';
const MOCK_USER_A = 'user-A';

// Mock dependencies
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => {
  const dbMock = {
    transaction: vi.fn(async (cb) => cb(dbMock)),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
  };
  return { db: dbMock };
});

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    recordFromSession: vi.fn(),
    record: vi.fn(),
  },
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Dispatch Status Flow Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 正常更新测量任务状态', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'task-1' }]),
        }),
      }),
    });
    (db.update as any) = updateMock;

    const result = await updateMeasureTaskStatus('task-1', 'COMPLETED');
    expect(result.success).toBe(true);
    expect(AuditService.record).toHaveBeenCalled();
  });

  it('2. 越权尝试更新测量状态应触发 ILLEGAL_ACCESS_ATTEMPT 审计', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]), // 模拟未找到记录
        }),
      }),
    });
    (db.update as any) = updateMock;

    await expect(updateMeasureTaskStatus('task-other', 'COMPLETED')).rejects.toThrow();
    expect(AuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ILLEGAL_ACCESS_ATTEMPT',
        tableName: 'measure_tasks',
      }),
      expect.anything()
    );
  });

  it('3. 正常更新安装任务状态', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'task-2' }]),
        }),
      }),
    });
    (db.update as any) = updateMock;

    const result = await updateInstallTaskStatus('task-2', 'COMPLETED');
    expect(result.success).toBe(true);
  });

  it('4. 越权尝试更新安装状态应触发 ILLEGAL_ACCESS_ATTEMPT 审计', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
    (db.update as any) = updateMock;

    await expect(updateInstallTaskStatus('task-other', 'COMPLETED')).rejects.toThrow();
    expect(AuditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ILLEGAL_ACCESS_ATTEMPT',
        tableName: 'install_tasks',
      }),
      expect.anything()
    );
  });

  it('5. 更新安装状态成功后应记录 AuditService', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'task-2' }]),
        }),
      }),
    });

    await updateInstallTaskStatus('task-2', 'DISPATCHING');
    expect(AuditService.record).toHaveBeenCalled();
  });
});
