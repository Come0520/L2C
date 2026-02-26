import { vi, describe, it, expect } from 'vitest';
import { validateLinesBalance } from '../services/journal-validation-service';

// Mock db 模块以避免模块解析错误（validateLinesBalance 是纯函数，不依赖 db）
vi.mock('@/shared/api/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

describe('validateLinesBalance', () => {
  it('借贷平衡时返回 isValid = true', () => {
    const lines = [
      { debitAmount: '1000.00', creditAmount: '0' },
      { debitAmount: '0', creditAmount: '1000.00' },
    ];
    const result = validateLinesBalance(lines);
    expect(result.isValid).toBe(true);
    expect(result.totalDebit).toBe('1000.00');
  });

  it('借贷不平衡时返回 isValid = false', () => {
    const lines = [
      { debitAmount: '1000.00', creditAmount: '0' },
      { debitAmount: '0', creditAmount: '900.00' },
    ];
    const result = validateLinesBalance(lines);
    expect(result.isValid).toBe(false);
  });

  it('空分录时返回平衡', () => {
    const result = validateLinesBalance([]);
    expect(result.isValid).toBe(true);
  });

  it('多行借贷各项汇总后平衡', () => {
    const lines = [
      { debitAmount: '500.00', creditAmount: '0' },
      { debitAmount: '300.00', creditAmount: '0' },
      { debitAmount: '200.00', creditAmount: '0' },
      { debitAmount: '0', creditAmount: '1000.00' },
    ];
    const result = validateLinesBalance(lines);
    expect(result.isValid).toBe(true);
  });
});
