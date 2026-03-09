import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalSearch } from '../actions';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      customers: { findMany: vi.fn().mockResolvedValue([]) },
      leads: { findMany: vi.fn().mockResolvedValue([]) },
      orders: { findMany: vi.fn().mockResolvedValue([]) },
      quotes: { findMany: vi.fn().mockResolvedValue([]) },
      products: { findMany: vi.fn().mockResolvedValue([]) },
      afterSalesTickets: { findMany: vi.fn().mockResolvedValue([]) },
      channels: { findMany: vi.fn().mockResolvedValue([]) },
      arStatements: { findMany: vi.fn().mockResolvedValue([]) },
      roles: { findMany: vi.fn().mockResolvedValue([{ permissions: ['*'] }]) },
      // TDD Fix: 补全 Search System Enhancement 新增的财务模块表 Mock
      apSupplierStatements: { findMany: vi.fn().mockResolvedValue([]) },
      apLaborStatements: { findMany: vi.fn().mockResolvedValue([]) },
      receiptBills: { findMany: vi.fn().mockResolvedValue([]) },
      paymentBills: { findMany: vi.fn().mockResolvedValue([]) },
    },
  },
}));

vi.mock('@/shared/lib/redis', () => ({
  redis: null,
}));

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((cb) => cb),
}));

// Mock AuditService，避免 globalSearch 内部审计调用因 db.insert 缺失而报错
vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}));

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const USER_ID = 'user-123';

const makeSession = () => ({
  user: { id: USER_ID, role: 'ADMIN', roles: ['ADMIN'], tenantId: TENANT_A, name: 'Admin' },
});

describe('Search 性能基线', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(makeSession() as any);
  });

  it('搜索响应应保持在合理时间内（单元测试环境下执行逻辑耗时）', async () => {
    const start = Date.now();
    await globalSearch({ query: 'performance test' });
    const duration = Date.now() - start;

    // 单元测试中不涉及 IO，正常应在 100ms 内（考虑 Mock 开销）
    expect(duration).toBeLessThan(500);
  });

  it('分页参数 limit 应正确传递给数据库查询', async () => {
    await globalSearch({ query: 'test', limit: 3, scope: 'customers' });

    expect(db.query.customers.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 3,
      })
    );
  });

  it('高频率搜索下 Zod 转换和业务逻辑应保持稳定', async () => {
    const queries = Array.from({ length: 10 }, (_, i) => `query-${i}`);
    const results = await Promise.all(queries.map((q) => globalSearch({ query: q })));

    expect(results.every((r) => r.success)).toBe(true);
  });
});
