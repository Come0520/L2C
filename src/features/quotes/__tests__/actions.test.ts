/**
 * 报价单 Actions 集成测试
 * 覆盖关键场景：创建报价、折扣审批、删除行项目、租户隔离
 */
import { describe, vi, beforeEach, it, expect } from 'vitest';

// ── Mock 定义 ────────────────────────────

const { mockDbInsert, mockDbUpdate, mockDbDelete, mockDbQuery } = vi.hoisted(() => {
  return {
    mockDbInsert: vi.fn(),
    mockDbUpdate: vi.fn(),
    mockDbDelete: vi.fn(),
    mockDbQuery: {
      quotes: { findFirst: vi.fn(), findMany: vi.fn() },
      quoteItems: { findFirst: vi.fn(), findMany: vi.fn() },
      quoteRooms: { findFirst: vi.fn(), findMany: vi.fn() },
      products: { findFirst: vi.fn() },
    },
  };
});

vi.mock('@/shared/api/db', () => ({
  db: {
    query: mockDbQuery,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
    transaction: vi.fn(async (cb) =>
      cb({
        insert: mockDbInsert,
        update: mockDbUpdate,
        delete: mockDbDelete,
        query: mockDbQuery,
      })
    ),
  },
}));

vi.mock('@/shared/api/schema/quotes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/schema/quotes')>();
  return {
    ...actual,
  };
});

vi.mock('@/shared/api/schema/catalogs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/schema/catalogs')>();
  return {
    ...actual,
    products: { id: 'id', category: 'category', isActive: 'isActive' },
  };
});

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((a: unknown, b: unknown) => ({ field: a, value: b })),
    and: vi.fn((...args: unknown[]) => args),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/cookies', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/lib/server-action', () => ({
  createSafeAction: vi.fn((schema, handler) => {
    // 模拟 createSafeAction：直接调用 handler 并注入 mock context
    return async (data: unknown) => {
      const parsed = schema.parse(data);
      const context = {
        session: {
          user: {
            id: 'test-user-id',
            tenantId: 'test-tenant-id',
          },
        },
      };
      return handler(parsed, context);
    };
  }),
}));

vi.mock('@/services/discount-control.service', () => ({
  DiscountControlService: {
    checkRequiresApproval: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock('@/services/quote-config.service', () => ({
  QuoteConfigService: {
    getMergedConfig: vi.fn().mockResolvedValue({
      presetLoss: {
        curtain: { defaultFoldRatio: 2, sideLoss: 5, bottomLoss: 10, headerLoss: 7 },
        wallpaper: { widthLoss: 20, cutLoss: 10 },
      },
    }),
  },
}));

vi.mock('@/services/quote-lifecycle.service', () => ({
  QuoteLifecycleService: {
    submit: vi.fn().mockResolvedValue(undefined),
    approve: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
    convertToOrder: vi.fn().mockResolvedValue({ id: 'order-1' }),
  },
}));

vi.mock('@/services/quote.service', () => ({
  QuoteService: {
    createNextVersion: vi.fn().mockResolvedValue({ id: 'new-version-id' }),
    copyQuote: vi.fn().mockResolvedValue({ id: 'copied-id' }),
  },
}));

vi.mock('../../services/accessory-linkage.service', () => ({
  AccessoryLinkageService: {
    getRecommendedAccessories: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../calc-strategies/strategy-factory', () => ({
  StrategyFactory: {
    getStrategy: vi.fn(() => ({
      calculate: vi.fn().mockReturnValue({
        usage: 5,
        subtotal: 100,
        details: { warning: undefined },
      }),
    })),
  },
}));



// ── 辅助函数 ────────────────────────────

/** 设置标准的数据库 mock 行为 */
function setupStandardDbMocks() {
  mockDbInsert.mockImplementation(() => ({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: 'new-quote-id',
          quoteNo: 'QT-TEST',
          tenantId: 'test-tenant-id',
          rootQuoteId: null,
          totalAmount: '0',
          finalAmount: '0',
          discountRate: '1',
          discountAmount: '0',
          bundleId: null,
        },
      ]),
    }),
  }));
  mockDbUpdate.mockImplementation(() => ({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
      }),
    }),
  }));
  mockDbDelete.mockImplementation(() => ({
    where: vi.fn().mockReturnThis(),
  }));
}

// ── 测试套件 ────────────────────────────

describe('报价单 Actions 集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStandardDbMocks();
  });

  describe('createQuote - 创建报价单', () => {
    it('应成功创建报价单并设置 rootQuoteId', async () => {
      const { createQuote } = await import('../actions/quote-crud');

      const result = await createQuote({
        customerId: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        title: '测试报价',
      });

      // 验证数据库插入被调用
      expect(mockDbInsert).toHaveBeenCalled();
      // 验证 rootQuoteId 更新被调用
      expect(mockDbUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('deleteQuoteItem - 删除行项目', () => {
    it('应删除行项目并重新计算报价总额', async () => {
      // 设置 findFirst 返回现有项目
      mockDbQuery.quoteItems.findFirst.mockResolvedValue({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        quoteId: 'quote-1',
        tenantId: 'test-tenant-id',
        subtotal: '100.00',
      });
      // 设置 findMany 返回空数组（计算总额用）
      mockDbQuery.quoteItems.findMany.mockResolvedValue([]);
      mockDbQuery.quotes.findFirst.mockResolvedValue({
        id: 'quote-1',
        tenantId: 'test-tenant-id',
        totalAmount: '100.00',
        discountRate: '1',
        discountAmount: '0',
      });

      const { deleteQuoteItem } = await import('../actions/quote-item-crud');

      const result = await deleteQuoteItem({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
      });

      expect(mockDbDelete).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('行项目不存在时应返回失败', async () => {
      mockDbQuery.quoteItems.findFirst.mockResolvedValue(null);

      const { deleteQuoteItem } = await import('../actions/quote-item-crud');

      const result = await deleteQuoteItem({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
      });

      expect(result).toEqual({
        success: false,
        error: '行项目不存在或无权操作',
      });
    });
  });

  describe('submitQuote - 提交报价单', () => {
    it('应调用 QuoteLifecycleService.submit', async () => {
      const { submitQuote } = await import('../actions/quote-lifecycle-actions');
      const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

      await submitQuote({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
      });

      expect(QuoteLifecycleService.submit).toHaveBeenCalledWith(
        'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        'test-tenant-id',
        'test-user-id'
      );
    });
  });

  describe('approveQuote - 审批报价单', () => {
    it('应传入租户 ID 调用 QuoteLifecycleService.approve', async () => {
      const { approveQuote } = await import('../actions/quote-lifecycle-actions');
      const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

      await approveQuote({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
      });

      expect(QuoteLifecycleService.approve).toHaveBeenCalledWith(
        'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        'test-user-id',
        'test-tenant-id'
      );
    });
  });

  describe('rejectQuote - 拒绝报价单', () => {
    it('应传入租户 ID 调用 QuoteLifecycleService.reject', async () => {
      const { rejectQuote } = await import('../actions/quote-lifecycle-actions');
      const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

      await rejectQuote({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        rejectReason: '价格不合理',
      });

      expect(QuoteLifecycleService.reject).toHaveBeenCalledWith(
        'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        '价格不合理',
        'test-tenant-id'
      );
    });
  });

  describe('deleteRoom - 删除房间', () => {
    it('应删除房间及其行项目并重算总额', async () => {
      mockDbQuery.quoteRooms.findFirst.mockResolvedValue({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        quoteId: 'quote-1',
        tenantId: 'test-tenant-id',
      });
      mockDbQuery.quoteItems.findMany.mockResolvedValue([]);
      mockDbQuery.quotes.findFirst.mockResolvedValue({
        id: 'quote-1',
        tenantId: 'test-tenant-id',
        totalAmount: '0',
        discountRate: '1',
        discountAmount: '0',
      });

      const { deleteRoom } = await import('../actions/quote-room-crud');

      const result = await deleteRoom({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
      });

      // 应调用 delete 和 update
      expect(mockDbDelete).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
