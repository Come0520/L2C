/**
 * income-statement-service.ts 单元测试
 * TDD — 利润表数据计算（收入/费用发生额、净利润、排序、浮点精度）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIncomeStatementData } from '../income-statement-service';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  selectEntries: vi.fn(), // 第1次 select → 凭证 IDs
  selectAccounts: vi.fn(), // 第2次 select → 科目（INCOME/EXPENSE）
  selectLines: vi.fn(), // 第3次 select → 分录行
  callCount: { value: 0 },
}));

vi.mock('@/shared/api/db', () => {
  const chain = (resolver: () => unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => resolver()),
    inArray: vi.fn().mockReturnThis(),
  });

  return {
    db: {
      select: vi.fn(() => {
        mocks.callCount.value++;
        const n = mocks.callCount.value;
        if (n === 1) return chain(mocks.selectEntries);
        if (n === 2) return chain(mocks.selectAccounts);
        return chain(mocks.selectLines);
      }),
    },
  };
});

const TENANT_ID = 'tenant-001';
const START = new Date('2026-01-01T00:00:00Z');
const END = new Date('2026-01-31T23:59:59Z');

function makeAccount(id: string, code: string, name: string, category: 'INCOME' | 'EXPENSE') {
  return { id, code, name, category, tenantId: TENANT_ID };
}
function makeLine(accountId: string, debitAmount: string, creditAmount: string) {
  return { entryId: 'e1', accountId, debitAmount, creditAmount };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.callCount.value = 0;
});

describe('getIncomeStatementData — 无数据', () => {
  it('无已记账凭证时返回空利润表', async () => {
    mocks.selectEntries.mockResolvedValue([]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.operatingIncome.total).toBe(0);
    expect(result.operatingExpense.total).toBe(0);
    expect(result.netIncome).toBe(0);
    expect(result.operatingIncome.items).toHaveLength(0);
  });

  it('有凭证但无 INCOME/EXPENSE 科目 → 返回空', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.operatingIncome.total).toBe(0);
    expect(result.operatingExpense.total).toBe(0);
  });
});

describe('getIncomeStatementData — 收入计算', () => {
  it('收入科目余额 = 贷方 - 借方', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '主营业务收入', 'INCOME'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '1000', '50000'), // 贷50000 - 借1000 = 49000
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    const item = result.operatingIncome.items[0];
    expect(item.balance).toBe(49000);
    expect(result.operatingIncome.total).toBe(49000);
  });

  it('零余额收入科目不出现在列表中', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '主营业务收入', 'INCOME'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '5000', '5000'), // 借贷相等 → 0
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.operatingIncome.items).toHaveLength(0);
  });
});

describe('getIncomeStatementData — 费用计算', () => {
  it('费用科目余额 = 借方 - 贷方', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-expense', '6601', '管理费用', 'EXPENSE'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-expense', '20000', '5000'), // 借20000 - 贷5000 = 15000
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.operatingExpense.items[0].balance).toBe(15000);
    expect(result.operatingExpense.total).toBe(15000);
  });
});

describe('getIncomeStatementData — 净利润计算', () => {
  it('净利润 = 收入总额 - 费用总额（正值）', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '主营业务收入', 'INCOME'),
      makeAccount('acc-expense', '6601', '管理费用', 'EXPENSE'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '0', '100000'),
      makeLine('acc-expense', '30000', '0'),
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.netIncome).toBe(70000);
  });

  it('亏损时净利润为负', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '主营业务收入', 'INCOME'),
      makeAccount('acc-expense', '6601', '管理费用', 'EXPENSE'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '0', '10000'),
      makeLine('acc-expense', '50000', '0'),
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.netIncome).toBe(-40000);
  });

  it('净利润保留两位小数', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-income', '6001', '收入', 'INCOME'),
      makeAccount('acc-expense', '6601', '费用', 'EXPENSE'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-income', '0', '10000.123'),
      makeLine('acc-expense', '3333.3333', '0'),
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    // netIncome = 10000.12 - 3333.33 = 6666.79（四舍五入至两位小数）
    expect(result.netIncome).toBeCloseTo(6666.79, 1);
    // total 应为2位精度
    expect(String(result.operatingIncome.total)).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});

describe('getIncomeStatementData — 科目排序', () => {
  it('收入科目按 code 升序排列', async () => {
    mocks.selectEntries.mockResolvedValue([{ id: 'e1' }]);
    mocks.selectAccounts.mockResolvedValue([
      makeAccount('acc-b', '6002', '其他收入', 'INCOME'),
      makeAccount('acc-a', '6001', '主营业务收入', 'INCOME'),
    ]);
    mocks.selectLines.mockResolvedValue([
      makeLine('acc-b', '0', '5000'),
      makeLine('acc-a', '0', '10000'),
    ]);

    const result = await getIncomeStatementData(TENANT_ID, START, END);

    expect(result.operatingIncome.items[0].code).toBe('6001');
    expect(result.operatingIncome.items[1].code).toBe('6002');
  });
});

describe('getIncomeStatementData — period 字段', () => {
  it('返回 periodStart/periodEnd 格式为 YYYY-MM-DD', async () => {
    mocks.selectEntries.mockResolvedValue([]);
    const result = await getIncomeStatementData(TENANT_ID, START, END);
    expect(result.periodStart).toBe('2026-01-01');
    expect(result.periodEnd).toBe('2026-01-31');
  });
});
