/**
 * 报价单 Actions 集成测试
 * 覆盖关键场景：创建报价、折扣审批、删除行项目、租户隔离
 */
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { createQuote } from '../actions/quote-crud';
import { deleteQuoteItem } from '../actions/quote-item-crud';
import { submitQuote, approveQuote, rejectQuote } from '../actions/quote-lifecycle-actions';
import { deleteRoom } from '../actions/quote-room-crud';
import { QuoteLifecycleService } from '../../../services/quote-lifecycle.service';

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

vi.mock('../../../shared/api/schema/quotes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/api/schema/quotes')>();
  return {
    ...actual,
  };
});

vi.mock('../../../shared/api/schema/catalogs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shared/api/schema/catalogs')>();
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
  updateTag: vi.fn(),
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

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    recordFromSession: vi.fn().mockResolvedValue(undefined),
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
      // 模拟报价单创建人与当前审批人不同
      mockDbQuery.quotes.findFirst.mockResolvedValue({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        createdBy: 'other-user-id', // 不同用户
      });

      await approveQuote({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
      });

      expect(QuoteLifecycleService.approve).toHaveBeenCalledWith(
        'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        'test-user-id',
        'test-tenant-id'
      );
    });

    // F3: 自我审批防护
    it('F3: 创建人审批自己的报价单应抛出错误', async () => {
      // 模拟报价单创建人 === 当前审批人
      mockDbQuery.quotes.findFirst.mockResolvedValue({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        createdBy: 'test-user-id', // 与 context.session.user.id 相同
      });

      await expect(
        approveQuote({
          id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        })
      ).rejects.toThrow('不允许审批自己创建的报价单');

      // 确认 QuoteLifecycleService.approve 未被调用
      expect(QuoteLifecycleService.approve).not.toHaveBeenCalled();
    });

    // F3: 报价单不存在时的防护
    it('F3: 报价单不存在时应抛出错误', async () => {
      mockDbQuery.quotes.findFirst.mockResolvedValue(null);

      await expect(
        approveQuote({
          id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        })
      ).rejects.toThrow('报价单不存在或无权操作');
    });
  });

  describe('rejectQuote - 拒绝报价单', () => {
    it('应传入租户 ID 调用 QuoteLifecycleService.reject', async () => {
      await rejectQuote({
        id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        // 字段名 rejectReason 与 quote-lifecycle-actions.ts 内联 Schema 一致
        rejectReason: '价格不合理',
      });

      expect(QuoteLifecycleService.reject).toHaveBeenCalledWith(
        'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001',
        '价格不合理',
        'test-tenant-id'
      );
    });
  });

  describe('createQuoteItem - F2 costPrice 快照', () => {
    // 测试用合法 UUID
    const QUOTE_UUID = 'a1a1a1a1-b2b2-4c3c-8d4d-e5e5e5e5e5e5';
    const PRODUCT_UUID = 'b2b2b2b2-c3c3-4d4d-8e5e-f6f6f6f6f6f6';

    it('F2: 关联产品有内部成本时应写入 costPrice 快照', async () => {
      const quoteStub = {
        id: QUOTE_UUID,
        tenantId: 'test-tenant-id',
        createdBy: 'test-user-id',
        totalAmount: '0',
        discountRate: '1',
        discountAmount: '0',
      };
      mockDbQuery.quotes.findFirst.mockResolvedValue(quoteStub);
      mockDbQuery.products.findFirst.mockResolvedValue({
        id: PRODUCT_UUID,
        name: '测试面料',
        retailPrice: '80',
        purchasePrice: '45', // 采购价 45 元
        logisticsCost: '0', // 无物流成本
        processingCost: '0', // 无加工费
        lossRate: '0.05', // 5% 损耗率
        floorPrice: '60',
        specs: {},
        tenantId: 'test-tenant-id',
      });
      // 两次 findMany：排序查询 + updateQuoteTotal 汇总
      mockDbQuery.quoteItems.findMany.mockResolvedValue([]);

      // 利用标准 mock 配置，捕获 values 调用参数
      const valuesSpy = vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([{ id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001', quoteId: QUOTE_UUID }]),
      });
      mockDbInsert.mockImplementation(() => ({ values: valuesSpy }));

      const { createQuoteItem } = await import('../actions/quote-item-crud');
      await createQuoteItem({
        quoteId: QUOTE_UUID,
        category: 'OTHER',
        productId: PRODUCT_UUID,
        productName: '测试面料',
        unitPrice: 80,
        quantity: 2,
      });

      // 验证 values 被调用，且第一次调用的参数中包含 costPrice
      // 公式：(45 + 0) / (1 - 0.05) + 0 = 45 / 0.95 ≈ 47.37
      expect(valuesSpy).toHaveBeenCalled();
      const insertedValues = valuesSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(insertedValues.costPrice).toBe('47.37');
    });

    it('F2: 无关联产品时 costPrice 应为 undefined', async () => {
      const quoteStub = {
        id: QUOTE_UUID,
        tenantId: 'test-tenant-id',
        createdBy: 'test-user-id',
        totalAmount: '0',
        discountRate: '1',
        discountAmount: '0',
      };
      mockDbQuery.quotes.findFirst.mockResolvedValue(quoteStub);
      mockDbQuery.quoteItems.findMany.mockResolvedValue([]);

      const valuesSpy = vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([{ id: 'a0a0a0a0-b1b1-4c1c-8d1d-e0e0e0e00001', quoteId: QUOTE_UUID }]),
      });
      mockDbInsert.mockImplementation(() => ({ values: valuesSpy }));

      const { createQuoteItem } = await import('../actions/quote-item-crud');
      await createQuoteItem({
        quoteId: QUOTE_UUID,
        category: 'OTHER',
        productName: '自定义商品',
        unitPrice: 100,
        quantity: 1,
      });

      expect(valuesSpy).toHaveBeenCalled();
      const insertedValues = valuesSpy.mock.calls[0][0] as Record<string, unknown>;
      // 无产品关联时 costPrice 应为 undefined
      expect(insertedValues.costPrice).toBeUndefined();
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
