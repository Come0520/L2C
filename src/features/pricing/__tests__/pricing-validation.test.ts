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

describe('Pricing Calculation & Rules (Comprehensive)', () => {
  let getPricingHints: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { checkPermission } = await import('@/shared/lib/auth');
    vi.mocked(checkPermission).mockResolvedValue(true);

    const pricingActions = await import('../actions/pricing-hints');
    getPricingHints = pricingActions.getPricingHints;
  });

  it('建议价不应低于底价红线 (floorPrice)', async () => {
    // mock Product: 底价 100，建议零售价 150
    mockDb.query.products.findFirst.mockResolvedValue({
      id: 'prod-1',
      tenantId: TENANT_A,
      name: '测试产品',
      category: 'TEST_CAT',
      purchasePrice: '50',
      floorPrice: '100', // 底价 100
      retailPrice: '150',
    });

    // 模拟历史成交均价非常低（如 80）
    mockDb.select
      .mockReturnValueOnce(
        createMockChain([
          {
            minPrice: '70',
            maxPrice: '90',
            avgPrice: '80', // 即使均价是 80
            count: 10,
          },
        ])
      ) // salesStats
      .mockReturnValueOnce(createMockChain([])) // quoteStats
      .mockReturnValueOnce(createMockChain([])) // priceTrends
      .mockReturnValueOnce(createMockChain([])); // categoryStats

    const result = await getPricingHints({ productId: 'prod-1' });

    expect(result.success).toBe(true);
    // 虽然历史均价是 80，但建议价应托底为 100.00
    expect(result.data.analysis.suggestedPrice).toBe('100.00');
    expect(result.data.analysis.floorPriceTriggered).toBe(true);
  });

  it('低毛利预警：毛利率低于 20% 时应触发告警', async () => {
    // 成本 90，建议零售价 100 -> 毛利 10%
    mockDb.query.products.findFirst.mockResolvedValue({
      id: 'prod-low-margin',
      tenantId: TENANT_A,
      name: '低毛利产品',
      category: 'CAT_A',
      purchasePrice: '90',
      floorPrice: '95',
      retailPrice: '100',
    });

    mockDb.select.mockReturnValue(createMockChain([]));

    const result = await getPricingHints({ productId: 'prod-low-margin' });
    expect(result.success).toBe(true);
    expect(result.data.analysis.isLowMargin).toBe(true);
  });

  it('Pricing Rules: 默认回退逻辑', async () => {
    // 当没有任何历史数据时，建议价应回退到 retailPrice
    mockDb.query.products.findFirst.mockResolvedValue({
      id: 'prod-no-history',
      tenantId: TENANT_A,
      name: '新产品',
      purchasePrice: '100',
      retailPrice: '200',
      unitPrice: '200',
    });

    mockDb.select.mockReturnValue(createMockChain([]));

    const result = await getPricingHints({ productId: 'prod-no-history' });
    expect(result.success).toBe(true);
    expect(result.data.analysis.suggestedPrice).toBe('200.00');
  });
});
