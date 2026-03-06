/**
 * logistics-check.ts 单元测试
 * TDD — RED 阶段：安装前物流到货状态检查
 * 覆盖：无采购单、全部到货、部分未到货、混合状态、大小写兼容、租户隔离
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkLogisticsReady } from '../logistics-check';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      purchaseOrders: {
        findMany: mocks.findMany,
      },
    },
  },
}));

// ---- 公共数据 ----
const ORDER_ID = 'order-001';
const TENANT_ID = 'tenant-abc';

/** 构造采购单 */
function makePO(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'po-1',
    poNo: 'PO-20260101',
    status: 'RECEIVED',
    supplierName: '测试供应商',
    orderId: ORDER_ID,
    tenantId: TENANT_ID,
    ...overrides,
  };
}

describe('checkLogisticsReady — 无采购单', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('订单无关联采购单时应视为可安装 → ready: true', async () => {
    mocks.findMany.mockResolvedValue([]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(true);
    expect(result.unreadyPos).toBeUndefined();
  });
});

describe('checkLogisticsReady — 全部到货', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('所有 PO 状态为 RECEIVED → ready: true', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ status: 'RECEIVED' }),
      makePO({ id: 'po-2', poNo: 'PO-002', status: 'RECEIVED' }),
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(true);
  });

  it('所有 PO 状态为 ARRIVED → ready: true', async () => {
    mocks.findMany.mockResolvedValue([makePO({ status: 'ARRIVED' })]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(true);
  });

  it('所有 PO 状态为 COMPLETED → ready: true', async () => {
    mocks.findMany.mockResolvedValue([makePO({ status: 'COMPLETED' })]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(true);
  });

  it('所有 PO 状态为 PARTIAL_RECEIVED → ready: true', async () => {
    mocks.findMany.mockResolvedValue([makePO({ status: 'PARTIAL_RECEIVED' })]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(true);
  });

  it('混合 RECEIVED / ARRIVED / COMPLETED → ready: true', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ id: 'po-1', status: 'RECEIVED' }),
      makePO({ id: 'po-2', status: 'ARRIVED' }),
      makePO({ id: 'po-3', status: 'COMPLETED' }),
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(true);
  });
});

describe('checkLogisticsReady — 存在未到货 PO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有 PENDING PO → ready: false，message 包含 PO 编号', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ id: 'po-1', poNo: 'PO-PENDING-001', status: 'PENDING' }),
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(false);
    expect(result.message).toContain('PO-PENDING-001');
    expect(result.unreadyPos).toContain('po-1');
  });

  it('有 IN_TRANSIT PO → ready: false', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ id: 'po-2', poNo: 'PO-TRANSIT-001', status: 'IN_TRANSIT' }),
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(false);
    expect(result.unreadyPos).toContain('po-2');
  });

  it('混合：部分 RECEIVED + 部分 PENDING → ready: false', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ id: 'po-1', poNo: 'PO-001', status: 'RECEIVED' }),
      makePO({ id: 'po-2', poNo: 'PO-002', status: 'PENDING' }),
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(false);
    expect(result.unreadyPos).toEqual(['po-2']);
    expect(result.message).toContain('PO-002');
    expect(result.message).not.toContain('PO-001'); // RECEIVED 的不出现在 message
  });

  it('多个未到货 PO → message 包含所有未到货编号', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ id: 'po-1', poNo: 'PO-001', status: 'PENDING' }),
      makePO({ id: 'po-2', poNo: 'PO-002', status: 'IN_TRANSIT' }),
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(false);
    expect(result.message).toContain('PO-001');
    expect(result.message).toContain('PO-002');
    expect(result.unreadyPos).toHaveLength(2);
  });
});

describe('checkLogisticsReady — 状态大小写兼容', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('小写 "received" 应被识别为已到货', async () => {
    mocks.findMany.mockResolvedValue([
      makePO({ status: 'received' }), // 小写
    ]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    // 源码使用 toUpperCase() 处理，小写也应认为已到货
    expect(result.ready).toBe(true);
  });

  it('status 为 null/undefined 的 PO 应视为未到货', async () => {
    mocks.findMany.mockResolvedValue([makePO({ id: 'po-null', poNo: 'PO-NULL', status: null })]);

    const result = await checkLogisticsReady(ORDER_ID, TENANT_ID);

    expect(result.ready).toBe(false);
    expect(result.unreadyPos).toContain('po-null');
  });
});

describe('checkLogisticsReady — 租户隔离', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findMany 应使用 tenantId 过滤（验证被调用）', async () => {
    mocks.findMany.mockResolvedValue([]);

    await checkLogisticsReady(ORDER_ID, 'tenant-xyz');

    expect(mocks.findMany).toHaveBeenCalledOnce();
  });
});
