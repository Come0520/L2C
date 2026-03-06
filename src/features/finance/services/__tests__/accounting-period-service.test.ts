/**
 * accounting-period-service.ts 单元测试
 * TDD — 账期管理：获取/自动创建账期、关账（草稿检查）、isPeriodOpen
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateCurrentPeriod,
  closeAccountingPeriod,
  isPeriodOpen,
} from '../accounting-period-service';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  selectPeriod: vi.fn(),
  insertPeriod: vi.fn(),
  selectDraftCount: vi.fn(),
  transaction: vi.fn(),
  selectPeriodForClose: vi.fn(),
  selectIsPeriod: vi.fn(),
  callCount: { value: 0 },
}));

vi.mock('@/shared/api/db', () => {
  const chain = (resolver: () => unknown) => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => resolver()),
    values: vi
      .fn()
      .mockImplementation((v: unknown) => ({ returning: vi.fn().mockResolvedValue([v]) })),
  });

  return {
    db: {
      select: vi.fn(() => {
        mocks.callCount.value++;
        const n = mocks.callCount.value;
        if (n === 1) return chain(mocks.selectPeriod);
        if (n === 2) return chain(mocks.selectDraftCount);
        return chain(mocks.selectIsPeriod);
      }),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockImplementation(() => mocks.insertPeriod()),
        })),
      })),
      transaction: mocks.transaction,
    },
  };
});

const TENANT_ID = 'tenant-001';
const PERIOD_ID = 'period-2026-03';
const OPERATOR_ID = 'admin-user';

const OPEN_PERIOD = {
  id: PERIOD_ID,
  tenantId: TENANT_ID,
  year: 2026,
  month: 3,
  quarter: 1,
  status: 'OPEN',
};

// ============================================================
// getOrCreateCurrentPeriod
// ============================================================
describe('getOrCreateCurrentPeriod — 已存在账期', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callCount.value = 0;
  });

  it('当月账期已存在时直接返回（不 insert）', async () => {
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD]);

    const result = await getOrCreateCurrentPeriod(TENANT_ID);

    expect(result.id).toBe(PERIOD_ID);
    expect(result.status).toBe('OPEN');
    // 不应调用 insert
    const { db } = await import('@/shared/api/db');
    expect(vi.mocked(db.insert)).not.toHaveBeenCalled();
  });

  it('返回账期包含 year/month/quarter 字段', async () => {
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD]);

    const result = await getOrCreateCurrentPeriod(TENANT_ID);

    expect(result).toMatchObject({ year: 2026, month: 3, quarter: 1 });
  });
});

describe('getOrCreateCurrentPeriod — 账期不存在时自动创建', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callCount.value = 0;
  });

  it('当月无账期时应调用 insert 并返回新记录', async () => {
    mocks.selectPeriod.mockResolvedValue([]); // 无现有账期
    mocks.insertPeriod.mockResolvedValue([{ ...OPEN_PERIOD, status: 'OPEN' }]);

    const result = await getOrCreateCurrentPeriod(TENANT_ID);

    expect(result.status).toBe('OPEN');
    const { db } = await import('@/shared/api/db');
    expect(vi.mocked(db.insert)).toHaveBeenCalledOnce();
  });
});

// ============================================================
// closeAccountingPeriod
// ============================================================
describe('closeAccountingPeriod — 失败场景', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callCount.value = 0;
  });

  it('账期不存在 → { success: false, error: "账期不存在" }', async () => {
    mocks.selectPeriodForClose = mocks.selectPeriod;
    mocks.selectPeriod.mockResolvedValue([]); // 查不到

    const result = await closeAccountingPeriod(PERIOD_ID, OPERATOR_ID, TENANT_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('账期不存在');
  });

  it('账期已是 CLOSED → { success: false, error: "账期已关闭" }', async () => {
    mocks.selectPeriod.mockResolvedValue([{ ...OPEN_PERIOD, status: 'CLOSED' }]);

    const result = await closeAccountingPeriod(PERIOD_ID, OPERATOR_ID, TENANT_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('账期已关闭');
  });

  it('存在未记账草稿凭证 → { success: false, error 含 "草稿" }', async () => {
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD]);
    mocks.selectDraftCount.mockResolvedValue([{ count: 3 }]); // 有3张草稿

    const result = await closeAccountingPeriod(PERIOD_ID, OPERATOR_ID, TENANT_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain('草稿');
    expect(result.error).toContain('3');
  });
});

describe('closeAccountingPeriod — 正常关账', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callCount.value = 0;
  });

  it('无草稿凭证，账期 OPEN → 关账成功', async () => {
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD]);
    mocks.selectDraftCount.mockResolvedValue([{ count: 0 }]);
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
        insert: vi.fn(() => ({ values: vi.fn() })),
      };
      return cb(tx);
    });

    const result = await closeAccountingPeriod(PERIOD_ID, OPERATOR_ID, TENANT_ID);

    expect(result.success).toBe(true);
  });

  it('关账时应调用事务 update + insert 审计日志', async () => {
    mocks.selectPeriod.mockResolvedValue([OPEN_PERIOD]);
    mocks.selectDraftCount.mockResolvedValue([{ count: 0 }]);

    let updateCalled = false;
    let insertCalled = false;
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => {
              updateCalled = true;
            }),
          })),
        })),
        insert: vi.fn(() => ({
          values: vi.fn(() => {
            insertCalled = true;
          }),
        })),
      };
      return cb(tx);
    });

    await closeAccountingPeriod(PERIOD_ID, OPERATOR_ID, TENANT_ID);

    expect(updateCalled).toBe(true);
    expect(insertCalled).toBe(true);
  });
});

// ============================================================
// isPeriodOpen
// ============================================================
describe('isPeriodOpen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callCount.value = 0;
  });

  it('账期状态 OPEN → 返回 true', async () => {
    mocks.selectPeriod.mockResolvedValue([{ status: 'OPEN' }]);
    const result = await isPeriodOpen(PERIOD_ID);
    expect(result).toBe(true);
  });

  it('账期状态 CLOSED → 返回 false', async () => {
    mocks.selectPeriod.mockResolvedValue([{ status: 'CLOSED' }]);
    const result = await isPeriodOpen(PERIOD_ID);
    expect(result).toBe(false);
  });

  it('账期不存在（空数组）→ 返回 false', async () => {
    mocks.selectPeriod.mockResolvedValue([]);
    const result = await isPeriodOpen(PERIOD_ID);
    expect(result).toBe(false);
  });
});
