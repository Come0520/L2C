/**
 * voucher-number-service.ts 单元测试
 * TDD — 凭证编号生成（格式验证、序号自增、月份边界、超限异常）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVoucherNo } from '../voucher-number-service';

// ---- Hoisted mocks ----
const mocks = vi.hoisted(() => ({
  selectMax: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockImplementation(() => mocks.selectMax()),
    })),
  },
}));

const TENANT_ID = 'tenant-001';

describe('generateVoucherNo — 格式校验', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectMax.mockResolvedValue([{ maxNo: null }]); // 当月无记录
  });

  const TYPE_CASES: Array<[string, string]> = [
    ['MANUAL', 'PZ'],
    ['AUTO_RECEIPT', 'RCV'],
    ['AUTO_PAYMENT', 'PAY'],
    ['AUTO_EXPENSE', 'EXP'],
    ['AUTO_TRANSFER', 'TRF'],
    ['AUTO_PURCHASE', 'PUR'],
    ['AUTO_ORDER', 'SLS'],
    ['REVERSAL', 'CX'],
  ];

  it.each(TYPE_CASES)(
    'sourceType=%s 应生成 %s-YYYY-MM-NNN 格式编号',
    async (sourceType, expectedPrefix) => {
      const now = new Date('2026-02-15T00:00:00Z');
      const result = await generateVoucherNo(
        TENANT_ID,
        sourceType as Parameters<typeof generateVoucherNo>[1],
        now
      );
      expect(result).toMatch(new RegExp(`^${expectedPrefix}-2026-02-\\d{3}$`));
    }
  );

  it('首张凭证序号应为 001', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: null }]);
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-01-01'));
    expect(result).toBe('PZ-2026-01-001');
  });
});

describe('generateVoucherNo — 自增序号', () => {
  beforeEach(() => vi.clearAllMocks());

  it('当月已有 001，下一张应为 002', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: 'PZ-2026-02-001' }]);
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-02-20'));
    expect(result).toBe('PZ-2026-02-002');
  });

  it('当月已有 009，下一张应为 010', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: 'RCV-2026-03-009' }]);
    const result = await generateVoucherNo(TENANT_ID, 'AUTO_RECEIPT', new Date('2026-03-01'));
    expect(result).toBe('RCV-2026-03-010');
  });

  it('当月已有 099，下一张应为 100', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: 'PAY-2026-04-099' }]);
    const result = await generateVoucherNo(TENANT_ID, 'AUTO_PAYMENT', new Date('2026-04-15'));
    expect(result).toBe('PAY-2026-04-100');
  });

  it('当月已有 998，下一张应为 999（上限前一张）', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: 'PZ-2026-05-998' }]);
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-05-01'));
    expect(result).toBe('PZ-2026-05-999');
  });
});

describe('generateVoucherNo — 超限异常', () => {
  it('当月序号已达 999 时应抛出错误', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: 'PZ-2026-06-999' }]);
    await expect(generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-06-01'))).rejects.toThrow(
      '已超上限'
    );
  });
});

describe('generateVoucherNo — 月份边界', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectMax.mockResolvedValue([{ maxNo: null }]);
  });

  it('1月应补零为 01', async () => {
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-01-15'));
    expect(result).toBe('PZ-2026-01-001');
  });

  it('12月应正确生成', async () => {
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-12-31'));
    expect(result).toBe('PZ-2026-12-001');
  });
});

describe('generateVoucherNo — maxNo 解析容错', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maxNo 格式异常时序号从 001 开始（NaN 保护）', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: 'PZ-2026-07-XXX' }]); // 末段非数字
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-07-01'));
    expect(result).toBe('PZ-2026-07-001');
  });

  it('结果为 undefined 时序号从 001 开始', async () => {
    mocks.selectMax.mockResolvedValue([{ maxNo: undefined }]);
    const result = await generateVoucherNo(TENANT_ID, 'MANUAL', new Date('2026-08-01'));
    expect(result).toBe('PZ-2026-08-001');
  });
});
