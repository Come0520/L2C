/**
 * journal-reversal-service.ts 单元测试
 * TDD — GREEN 阶段：凭证红字冲销
 *
 * 源码 select 调用顺序：
 *   1. journalEntries (原凭证)
 *   2. journalEntryLines (原始分录行)
 *   3. accountingPeriods (账期)
 *
 * 事务内 insert 顺序：
 *   [0] journalEntries.values → 凭证主记录（返回 [{id}]）
 *   [1] journalEntryLines.values → 分录行数组（不 returning）
 *   [2] financeAuditLogs.values → 审计日志（不 returning）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reverseJournalEntry } from '../journal-reversal-service';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  selectEntry: vi.fn(), // 第1次 select → 原凭证
  selectLines: vi.fn(), // 第2次 select → 分录行
  selectPeriod: vi.fn(), // 第3次 select → 账期
  transaction: vi.fn(),
  /** select 调用计数，由 beforeEach 重置 */
  cnt: { value: 0 },
}));

vi.mock('@/shared/api/db', () => {
  const chain = (resolver: () => unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => resolver()),
    innerJoin: vi.fn().mockReturnThis(),
  });

  return {
    db: {
      select: vi.fn(() => {
        mocks.cnt.value++;
        if (mocks.cnt.value === 1) return chain(mocks.selectEntry);
        if (mocks.cnt.value === 2) return chain(mocks.selectLines);
        return chain(mocks.selectPeriod);
      }),
      transaction: mocks.transaction,
    },
  };
});

// ---- 公共数据 ----
const ENTRY_ID = 'entry-001';
const OPERATOR_ID = 'user-admin';
const TENANT_ID = 'tenant-abc';
const DESC = '年末冲销';

const POSTED_ENTRY = {
  id: ENTRY_ID,
  tenantId: TENANT_ID,
  status: 'POSTED',
  periodId: 'period-2026-01',
  voucherNo: 'JR-20260101',
  totalDebit: '10000',
  totalCredit: '10000',
};

const OPEN_PERIOD_ROW = { id: 'period-2026-01', status: 'OPEN' };
const CLOSED_PERIOD_ROW = { id: 'period-2026-01', status: 'CLOSED' };

const SAMPLE_LINES = [
  {
    accountId: 'acc-cash',
    entryId: ENTRY_ID,
    debitAmount: '10000',
    creditAmount: '0',
    description: '收款',
    sortOrder: 0,
  },
  {
    accountId: 'acc-income',
    entryId: ENTRY_ID,
    debitAmount: '0',
    creditAmount: '10000',
    description: '销售收入',
    sortOrder: 1,
  },
];

// ---- 事务 mock 工厂 ----
// 捕获 insert().values() 的参数
function makeTxMock(captured: Array<unknown>) {
  return async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn((values: unknown) => {
          captured.push(values);
          return {
            // 只有凭证主记录调用 .returning()
            returning: vi.fn().mockResolvedValue([{ id: 'reversal-entry-001' }]),
          };
        }),
      })),
    };
    return callback(tx);
  };
}

// ---- 全局 beforeEach ----
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cnt.value = 0;
});

// ============================================================
// 1. 凭证不存在
// ============================================================
describe('reverseJournalEntry — 凭证不存在', () => {
  it('凭证不存在时返回 { success: false, error: "凭证不存在" }', async () => {
    mocks.selectEntry.mockResolvedValue([]); // 解构 [originalEntry] → undefined

    const result = await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    expect(result.success).toBe(false);
    expect(result.error).toBe('凭证不存在');
  });

  it('租户不匹配时 where 过滤后返回空 → 凭证不存在', async () => {
    mocks.selectEntry.mockResolvedValue([]);

    const result = await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, 'other-tenant', DESC);

    expect(result.success).toBe(false);
    expect(result.error).toBe('凭证不存在');
  });
});

// ============================================================
// 2. 凭证状态校验
// ============================================================
describe('reverseJournalEntry — 凭证状态校验', () => {
  it.each([['DRAFT'], ['CANCELLED'], ['REVERSED']])(
    '状态 %s 不可冲销 → error 包含"只有已记账"',
    async (status) => {
      mocks.selectEntry.mockResolvedValue([{ ...POSTED_ENTRY, status }]);

      const result = await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

      expect(result.success).toBe(false);
      expect(result.error).toContain('只有已记账');
    }
  );
});

// ============================================================
// 3. 账期状态检查
// 注意：源码顺序是 entry→lines→period，所以此测试需要同时 mock lines
// ============================================================
describe('reverseJournalEntry — 账期状态检查', () => {
  it('账期 CLOSED 时冲销被拒绝', async () => {
    mocks.selectEntry.mockResolvedValue([POSTED_ENTRY]);
    mocks.selectLines.mockResolvedValue(SAMPLE_LINES); // 第2次 select
    mocks.selectPeriod.mockResolvedValue([CLOSED_PERIOD_ROW]); // 第3次 select

    const result = await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    expect(result.success).toBe(false);
    expect(result.error).toContain('账期已关闭');
  });

  it('账期 OPEN 时可以继续', async () => {
    mocks.selectEntry.mockResolvedValue([POSTED_ENTRY]);
    mocks.selectLines.mockResolvedValue(SAMPLE_LINES);
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD_ROW]);
    mocks.transaction.mockImplementation(makeTxMock([]));

    const result = await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    expect(result.success).toBe(true);
  });
});

// ============================================================
// 4. 正常冲销逻辑
// ============================================================
describe('reverseJournalEntry — 正常冲销逻辑', () => {
  // 每个用例的 captured 独立新建
  let captured: Array<unknown>;

  beforeEach(() => {
    captured = [];
    mocks.selectEntry.mockResolvedValue([POSTED_ENTRY]);
    mocks.selectLines.mockResolvedValue(SAMPLE_LINES);
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD_ROW]);
    mocks.transaction.mockImplementation(makeTxMock(captured));
  });

  it('应成功返回 { success: true, reversalEntryId }', async () => {
    const result = await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);
    expect(result.success).toBe(true);
    expect(result.reversalEntryId).toBe('reversal-entry-001');
  });

  it('冲销凭证主记录包含 isReversal=true 和 reversedEntryId', async () => {
    await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    // captured[0] = journalEntries.values({...}) 的参数
    const entryValues = captured[0] as Record<string, unknown>;
    expect(entryValues.isReversal).toBe(true);
    expect(entryValues.reversedEntryId).toBe(ENTRY_ID);
  });

  it('冲销凭证借贷总额对调（totalDebit ↔ totalCredit）', async () => {
    await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    const entryValues = captured[0] as Record<string, unknown>;
    expect(entryValues.totalDebit).toBe(POSTED_ENTRY.totalCredit); // '10000' ↔ '10000'
    expect(entryValues.totalCredit).toBe(POSTED_ENTRY.totalDebit);
  });

  it('冲销凭证状态应为 DRAFT', async () => {
    await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    const entryValues = captured[0] as Record<string, unknown>;
    expect(entryValues.status).toBe('DRAFT');
  });

  it('sourceType 应标记为 REVERSAL', async () => {
    await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    const entryValues = captured[0] as Record<string, unknown>;
    expect(entryValues.sourceType).toBe('REVERSAL');
  });

  it('分录行数量与原凭证相同', async () => {
    await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    // captured[1] = journalEntryLines.values(reversalLines[]) 的参数，为数组
    const lineValues = captured[1] as Array<Record<string, unknown>>;
    expect(lineValues).toHaveLength(SAMPLE_LINES.length);
  });

  it('分录每行借贷方向对调', async () => {
    await reverseJournalEntry(ENTRY_ID, OPERATOR_ID, TENANT_ID, DESC);

    const lineValues = captured[1] as Array<Record<string, unknown>>;

    // 原行1: debit=10000, credit=0 → 冲销: debit=0, credit=10000
    expect(lineValues[0]?.debitAmount).toBe(SAMPLE_LINES[0].creditAmount);
    expect(lineValues[0]?.creditAmount).toBe(SAMPLE_LINES[0].debitAmount);

    // 原行2: debit=0, credit=10000 → 冲销: debit=10000, credit=0
    expect(lineValues[1]?.debitAmount).toBe(SAMPLE_LINES[1].creditAmount);
    expect(lineValues[1]?.creditAmount).toBe(SAMPLE_LINES[1].debitAmount);
  });
});
