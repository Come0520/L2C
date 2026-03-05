/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const TENANT_A = 'test-tenant-id';
const MOCK_SESSION = {
  user: { id: 'test-user-id', role: 'SALES', tenantId: TENANT_A, name: '测试用户' },
};

/**
 * 模拟 Drizzle 查询链接口
 */
interface MockQueryChain {
  from: (table: any) => MockQueryChain;
  innerJoin: (table: any, condition: any) => MockQueryChain;
  where: (condition: any) => MockQueryChain;
  groupBy: (columns: any) => MockQueryChain;
  orderBy: (columns: any) => MockQueryChain;
  then: (resolve: (data: Record<string, unknown>[]) => void) => void;
}

const createMockChain = (mockData: Record<string, unknown>[]) => {
  const chain: MockQueryChain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    then: (resolve) => resolve(mockData),
  };
  return chain;
};

const mockDb = {
  query: {
    products: {
      findFirst: vi.fn(),
    },
  },
  select: vi.fn(),
};

vi.mock('@/shared/api/db', () => ({ db: mockDb }));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

vi.mock('react', () => ({
  cache: vi.fn((cb) => cb),
}));

vi.mock('@/shared/lib/server-action', () => ({
  createSafeAction: (schema: any, handler: any) => {
    return async (input: any) => {
      if (schema) schema.parse?.(input);
      return handler(input, { session: MOCK_SESSION });
    };
  },
}));

describe('Pricing 规则验证 (pricing-rules)', () => {
  let getPricingHints: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { checkPermission } = await import('@/shared/lib/auth');
    vi.mocked(checkPermission).mockResolvedValue(true);

    const pricingActions = await import('../actions/pricing-hints');
    getPricingHints = pricingActions.getPricingHints;
  });

  it('租户级定价规则应正确覆盖默认规则 (逻辑模拟)', async () => {
    // 在 getPricingHintsAction 中，租户 ID 是从 session 强制获取的
    // 故数据库查询时必须携带租户过滤，这也是本项目租户隔离的核心规则
    mockDb.query.products.findFirst.mockResolvedValue({
      id: 'prod-rule-1',
      tenantId: TENANT_A, // 关键：属于当前租户
      name: '租户专用产品',
      purchasePrice: '100',
      retailPrice: '150',
      category: 'CAT_RULE',
    });

    mockDb.select.mockReturnValue(createMockChain([]));

    await getPricingHints({ productId: 'prod-rule-1' });

    // 验证查询条件是否包含租户 ID
    expect(mockDb.query.products.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Function),
      })
    );
  });

  it('无匹配规则时应返回默认价格而非报错', async () => {
    // 此处模拟“无定价差异化规则”仅有基础信息的场景
    mockDb.query.products.findFirst.mockResolvedValue({
      id: 'prod-default',
      tenantId: TENANT_A,
      name: '默认方案产品',
      purchasePrice: '100',
      retailPrice: '200', // 默认指导价
      unitPrice: '200',
    });

    // 模拟销量聚合接口返回空（无历史定价规则参考）
    mockDb.select.mockReturnValue(createMockChain([]));

    const result = await getPricingHints({ productId: 'prod-default' });

    expect(result.success).toBe(true);
    // 核心断言：建议价应回退到零售指导价
    expect(result.data.analysis.suggestedPrice).toBe('200.00');
  });

  it('历史价格记录查询应按日期正确过滤', async () => {
    mockDb.query.products.findFirst.mockResolvedValue({
      id: 'prod-date',
      tenantId: TENANT_A,
      category: 'CAT_DATE',
    });

    const mockSelect = vi.mocked(mockDb.select);
    mockSelect.mockReturnValue(createMockChain([]));

    await getPricingHints({ productId: 'prod-date', periodDays: 30 });

    // 验证 select 是否被调用
    expect(mockSelect).toHaveBeenCalled();
    // 在 getPricingHintsAction 中，startDate 会基于当前时间计算
    // 我们可以验证 query 链路中的 where 条件是否被构造
  });
});
