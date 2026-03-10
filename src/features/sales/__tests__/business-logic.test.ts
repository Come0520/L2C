import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSalesRanking,
  getSalesTargetWarnings,
  getSalesCompletionTrend,
} from '../actions/analytics';
import { auth, checkPermission } from '@/shared/lib/auth';

// ===== Mock 依赖 =====
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const mockDbFindFirstTargets = vi.fn();
const mockDbFindManyTargets = vi.fn();
const mockDbFindManyUsers = vi.fn();
const mockDbFindManyQuotes = vi.fn();

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      salesTargets: {
        findFirst: (...args: any[]) => mockDbFindFirstTargets(...args),
        findMany: (...args: any[]) => mockDbFindManyTargets(...args),
      },
      users: { findMany: (...args: any[]) => mockDbFindManyUsers(...args) },
      quotes: { findMany: (...args: any[]) => mockDbFindManyQuotes(...args) },
    },
  },
}));

const TENANT_ID = 'tenant-1';
const USER_1 = { id: 'u1', name: 'Sales 1', avatarUrl: null };
const USER_2 = { id: 'u2', name: 'Sales 2', avatarUrl: null };

describe('Sales 业务逻辑', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: 'admin', tenantId: TENANT_ID } } as any);
  });

  describe('getSalesRanking (销售排名)', () => {
    it('应根据完成金额准确排序并分配排名', async () => {
      mockDbFindManyUsers.mockResolvedValue([USER_1, USER_2]);
      // 模拟两个用户的目标
      mockDbFindManyTargets.mockResolvedValue([
        { userId: 'u1', targetAmount: '1000' },
        { userId: 'u2', targetAmount: '1000' },
      ]);
      // 用户 1 完成 500, 用户 2 完成 800
      mockDbFindManyQuotes.mockResolvedValue([
        {
          finalAmount: '500',
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
          status: 'ACCEPTED',
        },
        {
          finalAmount: '800',
          createdBy: 'u2',
          createdAt: new Date().toISOString(),
          status: 'ACCEPTED',
        },
      ]);

      const result = await getSalesRanking();
      expect(result.success).toBe(true);
      const data = result.data!;
      expect(data[0].userId).toBe('u2'); // 800 排名第一
      expect(data[0].rank).toBe(1);
      expect(data[1].userId).toBe('u1'); // 500 排名第二
      expect(data[1].rank).toBe(2);
    });
  });

  describe('getSalesTargetWarnings (进度预警)', () => {
    it('月中进度不足 80% 时应触发预警', async () => {
      // 模拟当前是 15 号，月份共 30 天，进度 50%
      const mockDate = new Date(2024, 2, 15); // 3月15号
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      mockDbFindManyUsers.mockResolvedValue([USER_1]);
      mockDbFindManyTargets.mockResolvedValue([{ userId: 'u1', targetAmount: '10000' }]);
      // 此时过去了 50% 时间，如果完成金额只有 3000，则预测月底完成 6000 (60%)
      mockDbFindManyQuotes.mockResolvedValue([
        {
          finalAmount: '3000',
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
          status: 'ACCEPTED',
        },
      ]);

      const result = await getSalesTargetWarnings();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].atRisk).toBe(true);
      expect(result.data![0].riskLevel).toBe('medium'); // 60% < 80%

      vi.useRealTimers();
    });
  });

  describe('空数据处理', () => {
    it('无销售人员时排名应返回空数组而不报错', async () => {
      mockDbFindManyUsers.mockResolvedValue([]);
      const result = await getSalesRanking();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('无目标设置时完成率应为 0', async () => {
      mockDbFindManyUsers.mockResolvedValue([USER_1]);
      mockDbFindManyTargets.mockResolvedValue([]);
      const result = await getSalesRanking();
      expect(result.data![0].completionRate).toBe(0);
    });
  });
});
