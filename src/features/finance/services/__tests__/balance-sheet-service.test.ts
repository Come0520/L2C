/**
 * balance-sheet-service.ts 单元测试
 * TDD — RED 阶段：资产负债表计算
 * 覆盖：资产/负债/权益分类计算、净利润注入权益、借贷平衡验证、浮点精度
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBalanceSheetData } from '../balance-sheet-service';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  selectEntries: vi.fn(),
  selectAccounts: vi.fn(),
  selectLines: vi.fn(),
}));

/**
 * 构建链式 DB mock：
 *   db.select().from().where() → entryIds
 *   db.select().from().where() → accounts
 *   db.select().from().where() → lines
 */
let selectCallCount = 0;

vi.mock('@/shared/api/db', () => {
  const makeChain = (resolver: () => unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => resolver()),
    innerJoin: vi.fn().mockReturnThis(),
    inArray: vi.fn().mockReturnThis(),
  });

  return {
    db: {
      select: vi.fn(() => {
        selectCallCount++;
        // 第1次: journalEntries (entryIds)
        if (selectCallCount === 1) return makeChain(mocks.selectEntries);
        // 第2次: chartOfAccounts
        if (selectCallCount === 2) return makeChain(mocks.selectAccounts);
        // 第3次: journalEntryLines
        return makeChain(mocks.selectLines);
      }),
    },
  };
});

// ---- 公共辅助 ----
const TENANT_ID = 'tenant-001';
const AS_OF = new Date('2026-03-31T00:00:00.000Z');

/** 构造科目记录 */
function makeAccount(
  id: string,
  code: string,
  name: string,
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'
) {
  return { id, code, name, category, tenantId: TENANT_ID };
}

/** 构造分录行 */
function makeLine(accountId: string, debitAmount: string, creditAmount: string) {
  return { accountId, debitAmount, creditAmount };
}

describe('getBalanceSheetData — 无凭证数据', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('无已记账凭证时返回空表且 isBalanced=true', async () => {
    mocks.selectEntries.mockResolvedValue([]); // 无凭证

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    expect(result.isBalanced).toBe(true);
    expect(result.assets.total).toBe(0);
    expect(result.liabilities.total).toBe(0);
    expect(result.equity.total).toBe(0);
    expect(result.assets.items).toHaveLength(0);
  });
});

describe('getBalanceSheetData — 资产类科目', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('资产类科目余额 = 借方 - 贷方', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([makeAccount('acc-cash', '1001', '现金', 'ASSET')]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-cash', '10000', '3000'), // 净资产 7000
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    const cashItem = result.assets.items.find((i) => i.code === '1001');
    expect(cashItem?.balance).toBe(7000);
    expect(result.assets.total).toBe(7000);
  });

  it('资产科目余额为 0 时不出现在列表中（过滤零余额）', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([makeAccount('acc-ar', '1122', '应收账款', 'ASSET')]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-ar', '5000', '5000'), // 借贷相等 → 余额 0
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    expect(result.assets.items).toHaveLength(0);
    expect(result.assets.total).toBe(0);
  });
});

describe('getBalanceSheetData — 负债类科目', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('负债类科目余额 = 贷方 - 借方', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-ap', '2202', '应付账款', 'LIABILITY'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-ap', '2000', '15000'), // 净负债 13000
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    const apItem = result.liabilities.items.find((i) => i.code === '2202');
    expect(apItem?.balance).toBe(13000);
    expect(result.liabilities.total).toBe(13000);
  });
});

describe('getBalanceSheetData — 权益类科目', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('权益类科目余额 = 贷方 - 借方', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-equity', '3101', '实收资本', 'EQUITY'),
    ]);
    mocks.selectLines.mockResolvedValue([makeLine('acc-equity', '0', '100000')]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    const eItem = result.equity.items.find((i) => i.code === '3101');
    expect(eItem?.balance).toBe(100000);
    expect(result.equity.total).toBe(100000);
  });
});

describe('getBalanceSheetData — 净利润注入权益', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('收入 > 费用时，净利润作为"未分配利润"出现在 equity 中', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '主营收入', 'INCOME'),
      makeAccount('acc-expense', '6601', '管理费用', 'EXPENSE'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '0', '50000'), // 收入 50000
      makeLine('acc-expense', '20000', '0'), // 费用 20000
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    const netProfitItem = result.equity.items.find((i) => i.id === 'virtual-net-profit');
    expect(netProfitItem).toBeDefined();
    expect(netProfitItem?.balance).toBe(30000); // 净利润 = 50000 - 20000
    expect(result.equity.total).toBe(30000);
  });

  it('收入 = 费用时，净利润为 0，不注入 equity', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '主营收入', 'INCOME'),
      makeAccount('acc-expense', '6601', '管理费用', 'EXPENSE'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '0', '20000'),
      makeLine('acc-expense', '20000', '0'),
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    const netProfitItem = result.equity.items.find((i) => i.id === 'virtual-net-profit');
    expect(netProfitItem).toBeUndefined(); // 净利润=0，不写入
  });
});

describe('getBalanceSheetData — 借贷平衡验证（isBalanced）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('资产 = 负债 + 权益（简单平衡）→ isBalanced: true', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-cash', '1001', '现金', 'ASSET'),
      makeAccount('acc-equity', '3101', '实收资本', 'EQUITY'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-cash', '50000', '0'), // 资产 50000
      makeLine('acc-equity', '0', '50000'), // 权益 50000
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    expect(result.isBalanced).toBe(true);
    expect(result.assets.total).toBe(50000);
    expect(result.equity.total).toBe(50000);
  });

  it('资产 ≠ 负债 + 权益（差额 > 0.01）→ isBalanced: false', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-cash', '1001', '现金', 'ASSET'),
      makeAccount('acc-equity', '3101', '实收资本', 'EQUITY'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-cash', '100000', '0'), // 资产 100000
      makeLine('acc-equity', '0', '50000'), // 权益 50000（不平衡）
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    expect(result.isBalanced).toBe(false);
  });

  it('差额 ≤ 0.01 因浮点处理应视为平衡', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-cash', '1001', '现金', 'ASSET'),
      makeAccount('acc-ap', '2202', '应付账款', 'LIABILITY'),
    ]);
    // 10000.005 vs 10000.00 → 差额 = 0.005 < 0.01 → 平衡
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-cash', '10000.005', '0'),
      makeLine('acc-ap', '0', '10000'),
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    expect(result.isBalanced).toBe(true);
  });
});

describe('getBalanceSheetData — 列表按 code 排序', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallCount = 0;
  });

  it('资产列表应按科目编码升序排列', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-b', '1122', '应收账款', 'ASSET'),
      makeAccount('acc-a', '1001', '现金', 'ASSET'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-b', '5000', '0'),
      makeLine('acc-a', '3000', '0'),
    ]);

    const result = await getBalanceSheetData(TENANT_ID, AS_OF);

    expect(result.assets.items[0].code).toBe('1001');
    expect(result.assets.items[1].code).toBe('1122');
  });
});
