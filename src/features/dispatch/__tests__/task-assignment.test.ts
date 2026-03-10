import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignMeasureWorker } from '../actions/dispatch-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

const MOCK_TENANT_A = 'tenant-A';
const MOCK_TENANT_B = 'tenant-B';
const MOCK_USER_A = 'user-A';
const MOCK_WORKER_A = 'worker-A';

// Mock dependencies
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/api/db', () => {
  const dbMock = {
    transaction: vi.fn(async (cb) => cb(dbMock)),
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

describe('Dispatch Assignment Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 正常指派测量工人', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: MOCK_WORKER_A,
      tenantId: MOCK_TENANT_A,
    });

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'task-1' }]),
        }),
      }),
    });
    (db.update as any) = updateMock;

    const result = await assignMeasureWorker('task-1', MOCK_WORKER_A);
    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('2. 指派给不存在或非本租户工人应抛错', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });
    (db.query.users.findFirst as any).mockResolvedValue(null);

    await expect(assignMeasureWorker('task-1', 'bad-worker')).rejects.toThrow(
      '目标工人不存在或不属于当前租户'
    );
  });

  it('3. 跨租户指派任务请求应因 WHERE 条件过滤而失败', async () => {
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: MOCK_WORKER_A,
      tenantId: MOCK_TENANT_A,
    });

    const updateMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]), // 模拟未找到该记录（租户不匹配）
        }),
      }),
    });
    (db.update as any) = updateMock;

    await expect(assignMeasureWorker('task-from-tenant-B', MOCK_WORKER_A)).rejects.toThrow(
      '测量任务不存在或无权限修改'
    );
  });

  it('4. 指派测量工人后应触发 revalidatePath', async () => {
    const { revalidatePath } = await import('next/cache');
    (auth as any).mockResolvedValue({
      user: { id: MOCK_USER_A, tenantId: MOCK_TENANT_A },
    });
    (db.query.users.findFirst as any).mockResolvedValue({
      id: MOCK_WORKER_A,
      tenantId: MOCK_TENANT_A,
    });
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'task-1' }]),
        }),
      }),
    });

    await assignMeasureWorker('task-1', MOCK_WORKER_A);
    expect(revalidatePath).toHaveBeenCalledWith('/dispatch');
  });

  it('5. 未登录用户尝试指派应抛错', async () => {
    (auth as any).mockResolvedValue(null);
    await expect(assignMeasureWorker('task-1', MOCK_WORKER_A)).rejects.toThrow('未授权访问');
  });
});
