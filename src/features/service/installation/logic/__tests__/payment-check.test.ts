/**
 * payment-check.ts 单元测试
 * TDD — RED 阶段：安装前收款检查
 * 覆盖：月结渠道、现结渠道、审批开关、全款已付、无订单等
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPaymentBeforeInstall } from '../payment-check';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  findFirstOrder: vi.fn(),
  findFirstLead: vi.fn(),
  findFirstChannel: vi.fn(),
  selectReceipts: vi.fn(),
  getTenantBusinessConfig: vi.fn(),
}));

vi.mock('@/shared/api/db', () => {
  // 构建链式调用结构 select().from().innerJoin().where()
  const receiptSelectChain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: (...args: unknown[]) => mocks.selectReceipts(...args),
  };

  return {
    db: {
      query: {
        orders: { findFirst: mocks.findFirstOrder },
        leads: { findFirst: mocks.findFirstLead },
        channels: { findFirst: mocks.findFirstChannel },
      },
      select: vi.fn(() => receiptSelectChain),
    },
  };
});

vi.mock('@/features/settings/actions/tenant-config', () => ({
  getTenantBusinessConfig: mocks.getTenantBusinessConfig,
}));

// ---- 默认配置 ----
/** 默认租户配置：不允许欠款安装 */
const DEFAULT_CONFIG = {
  arPayment: {
    allowDebtInstallCash: false,
    requireDebtInstallApproval: false,
  },
};

/** 允许欠款但需审批 */
const CONFIG_ALLOW_DEBT_NEED_APPROVAL = {
  arPayment: {
    allowDebtInstallCash: true,
    requireDebtInstallApproval: true,
  },
};

/** 允许欠款且不需审批 */
const CONFIG_ALLOW_DEBT_NO_APPROVAL = {
  arPayment: {
    allowDebtInstallCash: true,
    requireDebtInstallApproval: false,
  },
};

const ORDER_ID = 'order-001';
const TENANT_ID = 'tenant-abc';

describe('checkPaymentBeforeInstall — 订单不存在', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTenantBusinessConfig.mockResolvedValue(DEFAULT_CONFIG);
  });

  it('订单不存在时应返回 { passed: false, reason: "订单不存在" }', async () => {
    mocks.findFirstOrder.mockResolvedValue(null);

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(false);
    expect(result.reason).toBe('订单不存在');
  });
});

describe('checkPaymentBeforeInstall — 全款已付', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTenantBusinessConfig.mockResolvedValue(DEFAULT_CONFIG);
  });

  it('paidAmount >= orderAmount 时应直接放行', async () => {
    mocks.findFirstOrder.mockResolvedValue({
      id: ORDER_ID,
      tenantId: TENANT_ID,
      leadId: null,
      totalAmount: '10000',
    });
    // 模拟已收10000
    mocks.selectReceipts.mockResolvedValue([{ total: '10000' }]);

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(true);
    expect(result.details?.remainingAmount).toBeLessThanOrEqual(0);
  });

  it('paidAmount > orderAmount（超付）也应放行', async () => {
    mocks.findFirstOrder.mockResolvedValue({
      id: ORDER_ID,
      tenantId: TENANT_ID,
      leadId: null,
      totalAmount: '5000',
    });
    mocks.selectReceipts.mockResolvedValue([{ total: '5500' }]); // 多付500

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(true);
  });

  it('receipts 为空时 paidAmount=0，不应视为全款', async () => {
    mocks.findFirstOrder.mockResolvedValue({
      id: ORDER_ID,
      tenantId: TENANT_ID,
      leadId: null,
      totalAmount: '5000',
    });
    mocks.selectReceipts.mockResolvedValue([{ total: null }]); // 无收款

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    // 0 < 5000，不算全款 → 进入欠款判断流程
    expect(result.details?.paidAmount).toBe(0);
    expect(result.details?.remainingAmount).toBe(5000);
  });
});

describe('checkPaymentBeforeInstall — 现结渠道（无 leadId）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirstOrder.mockResolvedValue({
      id: ORDER_ID,
      tenantId: TENANT_ID,
      leadId: null, // 无来源线索 → 视为现结
      totalAmount: '8000',
    });
    mocks.selectReceipts.mockResolvedValue([{ total: '3000' }]); // 欠款5000
  });

  it('不允许欠款安装 → passed: false', async () => {
    mocks.getTenantBusinessConfig.mockResolvedValue(DEFAULT_CONFIG);

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(false);
    expect(result.reason).toContain('5000.00');
    expect(result.requiresApproval).toBeUndefined();
  });

  it('允许欠款但需审批 → passed: false, requiresApproval: true', async () => {
    mocks.getTenantBusinessConfig.mockResolvedValue(CONFIG_ALLOW_DEBT_NEED_APPROVAL);

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toContain('审批');
  });

  it('允许欠款且不需审批 → passed: true', async () => {
    mocks.getTenantBusinessConfig.mockResolvedValue(CONFIG_ALLOW_DEBT_NO_APPROVAL);

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(true);
  });
});

describe('checkPaymentBeforeInstall — 月结渠道', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTenantBusinessConfig.mockResolvedValue(DEFAULT_CONFIG);
    mocks.findFirstOrder.mockResolvedValue({
      id: ORDER_ID,
      tenantId: TENANT_ID,
      leadId: 'lead-001',
      totalAmount: '20000',
    });
    mocks.selectReceipts.mockResolvedValue([{ total: '0' }]); // 未付款
    mocks.findFirstLead.mockResolvedValue({ channelId: 'channel-001' });
  });

  it('欠款（20000）≤ 授信额度（50000）→ passed: true', async () => {
    mocks.findFirstChannel.mockResolvedValue({
      settlementType: 'MONTHLY',
      creditLimit: '50000',
    });

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(true);
    expect(result.details?.channelType).toBe('MONTHLY');
    expect(result.details?.creditLimit).toBe(50000);
  });

  it('欠款（20000）> 授信额度（10000）→ passed: false, requiresApproval: true', async () => {
    mocks.findFirstChannel.mockResolvedValue({
      settlementType: 'MONTHLY',
      creditLimit: '10000',
    });

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.passed).toBe(false);
    expect(result.requiresApproval).toBe(true);
    expect(result.reason).toContain('授信额度');
  });

  it('欠款 = 授信额度时刚好通过（边界值）', async () => {
    mocks.findFirstChannel.mockResolvedValue({
      settlementType: 'MONTHLY',
      creditLimit: '20000', // 等于欠款
    });

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    // totalDebt(20000) <= creditLimit(20000) → passed
    expect(result.passed).toBe(true);
  });

  it('存在线索但无关联渠道 → 按现结处理', async () => {
    mocks.findFirstLead.mockResolvedValue({ channelId: null });
    mocks.getTenantBusinessConfig.mockResolvedValue(DEFAULT_CONFIG); // 不允许欠款

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    // 无 channelId → 默认 PREPAY → 不允许欠款 → passed: false
    expect(result.passed).toBe(false);
  });

  it('leadId 存在但 lead 查不到 → 按现结处理', async () => {
    mocks.findFirstLead.mockResolvedValue(null);

    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    // 无 lead → 默认 PREPAY → 不允许欠款 → passed: false
    expect(result.passed).toBe(false);
  });
});

describe('checkPaymentBeforeInstall — details 数据完整性', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTenantBusinessConfig.mockResolvedValue(DEFAULT_CONFIG);
    mocks.findFirstOrder.mockResolvedValue({
      id: ORDER_ID,
      tenantId: TENANT_ID,
      leadId: null,
      totalAmount: '10000',
    });
    mocks.selectReceipts.mockResolvedValue([{ total: '3000' }]);
  });

  it('返回结果应包含 orderAmount / paidAmount / remainingAmount', async () => {
    const result = await checkPaymentBeforeInstall(ORDER_ID, TENANT_ID);

    expect(result.details).toMatchObject({
      orderAmount: 10000,
      paidAmount: 3000,
      remainingAmount: 7000,
    });
  });
});
