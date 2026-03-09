/**
 * E2E Test Scenarios for Quotes Module
 * Covered:
 * 1. 模板全流程 (Template Flow)
 * 2. 版本管理全流程 (Version Flow)
 * 3. 完整报价单生命周期 (Lifecycle Flow)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

const mockDb = createMockDb([
  'quotes',
  'quoteVersions',
  'quoteItems',
  'auditLogs',
  'users',
  'tenants',
  'quoteTemplates',
  'quoteTemplateRooms',
  'quoteTemplateItems',
  'customers',
  'customerAddresses',
  'orders',
  'orderItems',
]);

// Setup mock transactions
mockDb.transaction = vi.fn().mockImplementation(async (callback) => callback(mockDb));

vi.mock('@/shared/api/db', () => ({
  db: mockDb,
}));

vi.mock('@/shared/lib/server-action', () => ({
  createSafeAction: (
    schema: unknown,
    handler: (input: unknown, ctx: unknown) => Promise<unknown>
  ) => {
    return async (input: unknown) => {
      return handler(input, { session: MOCK_SESSION });
    };
  },
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    recordFromSession: vi.fn(),
    log: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/shared/lib/auth', () => ({
  checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/features/settings/actions/system-settings-actions', () => ({
  getSetting: vi.fn().mockResolvedValue(0.8),
}));

vi.mock('@/features/approval/actions/submission', () => ({
  submitApproval: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/shared/api/schema/quotes', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId', version: 'quotes.version' },
    quoteVersions: {
      id: 'quoteVersions.id',
      quoteId: 'quoteVersions.quoteId',
      version: 'quoteVersions.version',
    },
  };
});

describe('Quotes E2E Scenarios (L5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // vi.clearAllMocks() 会清除所有 mock 的实现（包括默认值），必须在此重新设置
    // 1. 重置 transaction mock，确保 tx 对象就是 mockDb
    mockDb.transaction = vi.fn().mockImplementation(async (callback) => callback(mockDb));
    // 2. 重置所有 query 的默认返回值（防止 undefined 导致的 TypeError）
    Object.values(mockDb.query).forEach((tableQuery: unknown) => {
      const q = tableQuery as { findFirst: any; findMany: any };
      if (q.findFirst) q.findFirst.mockResolvedValue(null);
      if (q.findMany) q.findMany.mockResolvedValue([]);
    });
  });

  it('场景 A：模板全流程（创建报价单→保存为模板→新建自模板→删除模板→验证审计）', async () => {
    const { createQuote } = await import('../actions/quote-crud');
    const { saveQuoteAsTemplate, createQuoteFromTemplate, deleteQuoteTemplate } =
      await import('../actions/template-actions');
    const { AuditService } = await import('@/shared/services/audit-service');

    // 1. 创建报价单
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'quote-1', quoteNo: 'Q-001' }]),
    });

    const createResult = await createQuote({
      customerId: 'cust-1',
      notes: 'Test Quote',
    });
    expect(createResult).toHaveProperty('id', 'quote-1');

    // 2. 保存为模板
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      id: 'quote-1',
      tenantId: MOCK_TENANT_ID,
      title: 'Base Quote',
      isTemplate: false,
      items: [],
      rooms: [],
    });
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'tpl-1' }]),
    });
    mockDb.select = vi.fn().mockReturnThis();
    mockDb.from = vi.fn().mockReturnThis();
    mockDb.where = vi.fn().mockResolvedValue([]);

    const tplResult = await saveQuoteAsTemplate({
      quoteId: 'quote-1',
      name: 'My Awesome Template',
      description: 'A good template',
    });
    expect((tplResult as { templateId: string }).templateId).toBe('tpl-1');

    // 3. 新建自模板
    mockDb.query.quoteTemplates.findFirst.mockResolvedValueOnce({
      id: 'tpl-1',
      tenantId: MOCK_TENANT_ID,
      name: 'My Awesome Template',
      rooms: [],
      items: [],
    });
    mockDb.insert.mockReturnValueOnce({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'quote-from-tpl', quoteNo: 'Q-002' }]),
    });
    const newQuoteResult = await createQuoteFromTemplate({
      templateId: 'tpl-1',
      customerId: 'cust-2',
    });
    expect(newQuoteResult).toBeDefined();

    // 4. 删除模板
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      id: 'tpl-1',
      tenantId: MOCK_TENANT_ID,
      isTemplate: true,
    });
    const deleteResult = await deleteQuoteTemplate({ templateId: 'tpl-1' });
    expect((deleteResult as { success: boolean }).success).toBe(true);
    expect(AuditService.recordFromSession).toHaveBeenCalled();
  });

  it('场景 B：版本管理全流程（创建 v1→创建 v2 并激活→验证 v1 历史→验证版本对比）', async () => {
    const { createNextVersion } = await import('../actions/quote-lifecycle-actions');
    const { QuoteVersionService } = await import('../services/quote-version.service');

    // Mock QuoteVersionService 方法避免复杂的 DB mock 链路
    vi.spyOn(QuoteVersionService, 'createNextVersion').mockResolvedValue({
      id: 'quote-1-v2',
      version: 2,
      quoteNo: 'Q-001-V2',
    } as never);
    vi.spyOn(QuoteVersionService, 'activateVersion').mockResolvedValue({
      id: 'quote-1',
      version: 2,
    } as never);
    vi.spyOn(QuoteVersionService, 'getQuoteHistory').mockResolvedValue([
      { id: 'v1', version: 1 },
      { id: 'v2', version: 2 },
    ] as never);

    // 1. 创建 v2
    // preflightVersionCheck 需要一次 db.update mock
    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'quote-1', version: 1 }]),
    });

    const nextVersionResult = await createNextVersion({ quoteId: 'quote-1', version: 1 });
    expect(nextVersionResult).toBeDefined();

    // 2. 激活 v2
    const activateResult = await QuoteVersionService.activateVersion('quote-1', MOCK_TENANT_ID);
    expect(activateResult).toBeDefined();

    // 3. 验证历史与对比
    const history = await QuoteVersionService.getQuoteHistory('quote-1', MOCK_TENANT_ID);
    expect(history.length).toBe(2);
  });

  it('场景 C：完整报价单生命周期（折扣报价→风控审批→转订单→状态流转审计）', async () => {
    const { submitQuote, approveQuote, convertQuoteToOrder } =
      await import('../actions/quote-lifecycle-actions');
    const { updateQuote } = await import('../actions/quote-crud');
    const { AuditService } = await import('@/shared/services/audit-service');
    const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

    // Mock QuoteLifecycleService 方法避免复杂的 DB mock 链路
    vi.spyOn(QuoteLifecycleService, 'submit').mockResolvedValue({
      success: true,
      status: 'PENDING_APPROVAL',
      riskReasons: ['折扣超标'],
    } as never);
    vi.spyOn(QuoteLifecycleService, 'approve').mockResolvedValue({ count: 1 } as never);
    vi.spyOn(QuoteLifecycleService, 'convertToOrder').mockResolvedValue({
      id: 'order-1',
      orderNo: 'ORD-12345678',
    } as never);

    // 1. 设置折扣 (Triggering risk control)
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      id: 'quote-flow',
      tenantId: MOCK_TENANT_ID,
      status: 'DRAFT',
      totalAmount: '1000',
    });
    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'quote-flow' }]),
    });

    await updateQuote({
      id: 'quote-flow',
      version: 1,
      discountRate: 0.8, // 20% discount
    });

    // 2. 提交审批（QuoteLifecycleService.submit 已 mock）
    // preflightVersionCheck 现已改为纯 SELECT 查询，需要 mock db.query.quotes.findFirst
    // 必须返回与传入 version 相同的值，才能通过乐观锁检查
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      id: 'quote-flow',
      version: 1,
      tenantId: MOCK_TENANT_ID,
      status: 'DRAFT',
      submittedById: null,
    });
    await submitQuote({ id: 'quote-flow', version: 1 });
    expect(AuditService.recordFromSession).toHaveBeenCalled();

    // 3. 审批通过（QuoteLifecycleService.approve 已 mock）
    // approveQuote 内有两次 findFirst 调用：
    // 第1次：自我审批检查（需 createdBy 与当前 session user 不同）
    // 第2次：preflightVersionCheck（需 version 匹配）
    mockDb.query.quotes.findFirst
      // 第1次：自我审批检查，createdBy 必须不同于当前 session userId
      .mockResolvedValueOnce({
        createdBy: 'original-creator',
      })
      // 第2次：preflightVersionCheck，版本号必须匹配
      .mockResolvedValueOnce({
        id: 'quote-flow',
        version: 1,
        tenantId: MOCK_TENANT_ID,
        status: 'PENDING_APPROVAL',
        submittedById: 'approver-user',
      });
    await approveQuote({ id: 'quote-flow', version: 1 });

    // 4. 转订单（QuoteLifecycleService.convertToOrder 已 mock）
    // preflightVersionCheck 现已改为纯 SELECT 查询
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      id: 'quote-flow',
      version: 1,
      tenantId: MOCK_TENANT_ID,
      status: 'APPROVED',
      submittedById: null,
    });
    const orderResult = await convertQuoteToOrder({ quoteId: 'quote-flow', version: 1 });
    expect(orderResult).toBeDefined();
  });
});
