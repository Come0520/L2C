/**
 * fee-admission.ts 单元测试
 *
 * 覆盖:
 * - checkOrderDeposit()：订单定金支付状态校验
 * - checkMeasureFeeAdmission()：测量费准入校验
 * - checkDispatchAdmission()：派遣前定金校验
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkOrderDeposit,
  checkMeasureFeeAdmission,
  checkDispatchAdmission,
} from '../fee-admission';

// -------------------------
// Mock 数据库
// -------------------------
const mockOrderQuery = vi.fn();

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      orders: {
        findFirst: (...args: unknown[]) => mockOrderQuery(...args),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
      })),
    })),
  },
}));

vi.mock('@/shared/api/schema', () => ({
  receiptBills: {
    tenantId: 'tenantId',
    customerId: 'customerId',
    status: 'status',
    totalAmount: 'totalAmount',
  },
  orders: { id: 'id', tenantId: 'tenantId' },
}));

// -------------------------
// checkOrderDeposit()
// -------------------------
describe('checkOrderDeposit()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('订单不存在时 canProceed 应为 false', async () => {
    mockOrderQuery.mockResolvedValue(null);

    const result = await checkOrderDeposit('order-not-found', 'tenant-1');

    expect(result.canProceed).toBe(false);
    expect(result.message).toBe('订单不存在');
    expect(result.requiresDeposit).toBe(false);
    expect(result.totalAmount).toBe(0);
  });

  it('小额订单 (<=500元) 应免定金且 canProceed 为 true', async () => {
    mockOrderQuery.mockResolvedValue({
      id: 'order-1',
      totalAmount: '300',
      balanceAmount: '300', // 全部未付
    });

    const result = await checkOrderDeposit('order-1', 'tenant-1');

    expect(result.canProceed).toBe(true);
    expect(result.requiresDeposit).toBe(false);
    expect(result.message).toBe('小额订单免定金');
    expect(result.totalAmount).toBe(300);
  });

  it('恰好等于 500 元的订单应免定金', async () => {
    mockOrderQuery.mockResolvedValue({
      id: 'order-1',
      totalAmount: '500',
      balanceAmount: '500',
    });

    const result = await checkOrderDeposit('order-1', 'tenant-1');

    expect(result.requiresDeposit).toBe(false);
    expect(result.canProceed).toBe(true);
  });

  it('大额订单定金已足额支付时 canProceed 为 true', async () => {
    // 总价 3000，余额 2000，已付 1000，定金要求 30% = 900
    mockOrderQuery.mockResolvedValue({
      id: 'order-2',
      totalAmount: '3000',
      balanceAmount: '2000',
    });

    const result = await checkOrderDeposit('order-2', 'tenant-1');

    expect(result.canProceed).toBe(true);
    expect(result.isDepositPaid).toBe(true);
    expect(result.requiresDeposit).toBe(true);
    expect(result.paidAmount).toBe(1000);
    expect(result.requiredDepositAmount).toBe(900); // 3000 * 0.3
  });

  it('大额订单定金不足时 canProceed 为 false', async () => {
    // 总价 3000，余额 2700，已付 300，定金要求 30% = 900
    mockOrderQuery.mockResolvedValue({
      id: 'order-3',
      totalAmount: '3000',
      balanceAmount: '2700',
    });

    const result = await checkOrderDeposit('order-3', 'tenant-1');

    expect(result.canProceed).toBe(false);
    expect(result.isDepositPaid).toBe(false);
    expect(result.paidAmount).toBe(300);
    expect(result.requiredDepositAmount).toBe(900);
    expect(result.message).toContain('定金未足额支付');
  });

  it('支持自定义 depositRate 配置', async () => {
    // 总价 2000，余额 1400，已付 600，自定义定金率 20% = 400
    mockOrderQuery.mockResolvedValue({
      id: 'order-4',
      totalAmount: '2000',
      balanceAmount: '1400',
    });

    const result = await checkOrderDeposit('order-4', 'tenant-1', { depositRate: 0.2 });

    expect(result.requiredDepositRate).toBe(0.2);
    expect(result.requiredDepositAmount).toBe(400); // 2000 * 0.2
    expect(result.isDepositPaid).toBe(true); // 600 >= 400
    expect(result.canProceed).toBe(true);
  });

  it('支持自定义 exemptThreshold 配置', async () => {
    // 总价 800，自定义免定金阈值 1000
    mockOrderQuery.mockResolvedValue({
      id: 'order-5',
      totalAmount: '800',
      balanceAmount: '800',
    });

    // 阈值 1000，800 <= 1000，应免定金
    const result = await checkOrderDeposit('order-5', 'tenant-1', { exemptThreshold: 1000 });

    expect(result.requiresDeposit).toBe(false);
    expect(result.canProceed).toBe(true);
  });

  it('定金已支付时 message 包含已支付金额信息', async () => {
    mockOrderQuery.mockResolvedValue({
      id: 'order-6',
      totalAmount: '2000',
      balanceAmount: '1000', // 已付 1000，需 600 (30%)
    });

    const result = await checkOrderDeposit('order-6', 'tenant-1');

    expect(result.message).toContain('定金已支付');
    expect(result.message).toContain('1000.00');
    expect(result.message).toContain('600.00');
  });
});

// -------------------------
// checkMeasureFeeAdmission()
// -------------------------
describe('checkMeasureFeeAdmission()', () => {
  it('申请免费测量时 canProceed 为 false（需等待审批）', async () => {
    const result = await checkMeasureFeeAdmission('lead-1', 'tenant-1', true);

    expect(result.canProceed).toBe(false);
    expect(result.exemptApproved).toBe(false);
    expect(result.requiresFee).toBe(true);
    expect(result.message).toContain('审批');
  });

  it('正常测量（不免费）时 canProceed 为 true', async () => {
    const result = await checkMeasureFeeAdmission('lead-2', 'tenant-1', false);

    expect(result.canProceed).toBe(true);
    expect(result.requiresFee).toBe(true);
    expect(result.isPaid).toBe(false); // 现场收取
    expect(result.message).toContain('现场收取');
  });

  it('免费申请与正常申请返回不同结果', async () => {
    const freeResult = await checkMeasureFeeAdmission('lead-1', 'tenant-1', true);
    const normalResult = await checkMeasureFeeAdmission('lead-1', 'tenant-1', false);

    expect(freeResult.canProceed).toBe(false);
    expect(normalResult.canProceed).toBe(true);
  });
});

// -------------------------
// checkDispatchAdmission()
// -------------------------
describe('checkDispatchAdmission()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skipCheck=true 时无需校验直接放行', async () => {
    const result = await checkDispatchAdmission(null, 'lead-1', 'tenant-1', true);

    expect(result.canDispatch).toBe(true);
    expect(result.reason).toBe('无需定金校验');
    // 未查询数据库
    expect(mockOrderQuery).not.toHaveBeenCalled();
  });

  it('orderId 为 null 时放行（测量费现场收取）', async () => {
    const result = await checkDispatchAdmission(null, 'lead-1', 'tenant-1', false);

    expect(result.canDispatch).toBe(true);
    expect(result.reason).toBe('无关联订单，测量费现场收取');
    expect(result.depositStatus).toBeUndefined();
  });

  it('orderId 存在且定金不足时阻止派遣', async () => {
    // 总价 3000，余额 2800，已付 200 < 900 (30%)
    mockOrderQuery.mockResolvedValue({
      id: 'order-poor',
      totalAmount: '3000',
      balanceAmount: '2800',
    });

    const result = await checkDispatchAdmission('order-poor', 'lead-1', 'tenant-1');

    expect(result.canDispatch).toBe(false);
    expect(result.reason).toContain('定金未足额支付');
    expect(result.depositStatus).toBeDefined();
    expect(result.depositStatus?.canProceed).toBe(false);
  });

  it('orderId 存在且定金充足时正常放行', async () => {
    // 总价 3000，余额 1500，已付 1500 >= 900 (30%)
    mockOrderQuery.mockResolvedValue({
      id: 'order-paid',
      totalAmount: '3000',
      balanceAmount: '1500',
    });

    const result = await checkDispatchAdmission('order-paid', 'lead-1', 'tenant-1');

    expect(result.canDispatch).toBe(true);
    expect(result.depositStatus?.isDepositPaid).toBe(true);
  });

  it('小额订单无需定金时直接放行', async () => {
    // 总价 300，小额订单免定金
    mockOrderQuery.mockResolvedValue({
      id: 'order-small',
      totalAmount: '300',
      balanceAmount: '300',
    });

    const result = await checkDispatchAdmission('order-small', 'lead-1', 'tenant-1');

    expect(result.canDispatch).toBe(true);
    expect(result.depositStatus?.requiresDeposit).toBe(false);
  });

  it('skipCheck 默认值为 false（不跳过校验）', async () => {
    // 不传 skipCheck 参数，应正常校验（有关联订单）
    mockOrderQuery.mockResolvedValue({
      id: 'order-default',
      totalAmount: '2000',
      balanceAmount: '1000', // 已付 1000 >= 600，放行
    });

    // 不传第4个参数
    const result = await checkDispatchAdmission('order-default', 'lead-1', 'tenant-1');

    expect(result.canDispatch).toBe(true);
    // 说明 skipCheck 默认 false，确实走了校验
    expect(mockOrderQuery).toHaveBeenCalled();
  });
});
