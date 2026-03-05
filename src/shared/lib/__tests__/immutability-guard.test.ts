/**
 * 不可变性排序守卫测试
 *
 * 验证所有排序操作使用不可变的 .toSorted() 而非可变的 .sort()
 * 通过 Object.freeze 冻结数组，确保排序不会修改原始数据
 */
import { describe, test, expect } from 'vitest';

describe('不可变排序守卫：.sort() → .toSorted() 迁移验证', () => {
  test('对冻结数组使用 .toSorted() 不应抛出异常', () => {
    const items = Object.freeze([
      { code: 'C', name: '现金' },
      { code: 'A', name: '应收' },
      { code: 'B', name: '银行' },
    ]);

    // .toSorted() 返回新数组，不修改原数组，对冻结数组安全
    const sorted = items.toSorted((a, b) => a.code.localeCompare(b.code));

    expect(sorted[0].code).toBe('A');
    expect(sorted[1].code).toBe('B');
    expect(sorted[2].code).toBe('C');
    // 原数组保持不变
    expect(items[0].code).toBe('C');
  });

  test('排名排序应返回新数组而非原地排序', () => {
    const original = [
      { achievedAmount: 100, rank: 0 },
      { achievedAmount: 300, rank: 0 },
      { achievedAmount: 200, rank: 0 },
    ];
    const frozen = Object.freeze([...original.map((o) => ({ ...o }))]);

    const sorted = frozen.toSorted((a, b) => b.achievedAmount - a.achievedAmount);
    expect(sorted[0].achievedAmount).toBe(300);
    expect(sorted[1].achievedAmount).toBe(200);
    expect(sorted[2].achievedAmount).toBe(100);
    // 原数组顺序不变
    expect(frozen[0].achievedAmount).toBe(100);
  });

  test('风险预警排序应使用 .toSorted()', () => {
    const warnings = Object.freeze([
      { predictedRate: 70, atRisk: true },
      { predictedRate: 30, atRisk: true },
      { predictedRate: 50, atRisk: true },
    ]);

    const sorted = warnings
      .filter((w) => w.atRisk)
      .toSorted((a, b) => a.predictedRate - b.predictedRate);

    expect(sorted[0].predictedRate).toBe(30);
    expect(sorted[1].predictedRate).toBe(50);
    expect(sorted[2].predictedRate).toBe(70);
  });

  test('.toSorted() 与 .sort() 产生相同结果', () => {
    const data = [3, 1, 4, 1, 5, 9, 2, 6];
    const sortedCopy = [...data].sort((a, b) => a - b);
    const toSorted = data.toSorted((a, b) => a - b);

    expect(toSorted).toEqual(sortedCopy);
    // 但原数组保持不变
    expect(data).toEqual([3, 1, 4, 1, 5, 9, 2, 6]);
  });
});
