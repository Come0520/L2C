import { describe, it, expect } from 'vitest';
import {
  calculateInternalCost,
  calculateGrossMargin,
  calculateSuggestedRetailPrice,
} from '@/shared/lib/product-cost';

describe('商品成本计算工具 (product-cost)', () => {
  describe('calculateInternalCost - 真实成本计算', () => {
    it('应正确计算面料真实成本（标准场景）', () => {
      // (50 + 2) / (1 - 0.05) + 15 = 54.7368... + 15 = 69.7368... => 69.74
      const result = calculateInternalCost({
        purchasePrice: 50,
        logisticsCost: 2,
        processingCost: 15,
        lossRate: 0.05,
      });
      expect(result).toBe(69.74);
    });

    it('应在无损耗时直接相加', () => {
      // (50 + 2) / (1 - 0) + 15 = 52 + 15 = 67
      const result = calculateInternalCost({
        purchasePrice: 50,
        logisticsCost: 2,
        processingCost: 15,
        lossRate: 0,
      });
      expect(result).toBe(67);
    });

    it('应在无加工费时仅计算含损耗材料成本', () => {
      // (100 + 10) / (1 - 0.1) = 110 / 0.9 = 122.2222... => 122.22
      const result = calculateInternalCost({
        purchasePrice: 100,
        logisticsCost: 10,
        processingCost: 0,
        lossRate: 0.1,
      });
      expect(result).toBe(122.22);
    });

    it('应在损耗率 >= 1 时抛出错误', () => {
      expect(() =>
        calculateInternalCost({
          purchasePrice: 50,
          logisticsCost: 2,
          processingCost: 15,
          lossRate: 1,
        })
      ).toThrow('损耗率不能 ≥ 100%');
    });

    it('应在损耗率为负数时抛出错误', () => {
      expect(() =>
        calculateInternalCost({
          purchasePrice: 50,
          logisticsCost: 2,
          processingCost: 15,
          lossRate: -0.1,
        })
      ).toThrow('损耗率不能为负数');
    });
  });

  describe('calculateGrossMargin - 毛利率计算', () => {
    it('应正确计算正毛利率', () => {
      // (100 - 69.74) / 100 * 100 = 30.26%
      const result = calculateGrossMargin({
        internalCost: 69.74,
        sellingPrice: 100,
      });
      expect(result).toBe(30.26);
    });

    it('应正确计算负毛利率（亏损场景）', () => {
      // (50 - 69.74) / 50 * 100 = -39.48%
      const result = calculateGrossMargin({
        internalCost: 69.74,
        sellingPrice: 50,
      });
      expect(result).toBe(-39.48);
    });

    it('应在售价 <= 0 时抛出错误', () => {
      expect(() => calculateGrossMargin({ internalCost: 50, sellingPrice: 0 })).toThrow(
        '销售单价必须大于 0'
      );
    });
  });

  describe('calculateSuggestedRetailPrice - 建议零售价反推', () => {
    it('应根据目标毛利率反推零售价', () => {
      // 69.74 / (1 - 0.4) = 69.74 / 0.6 = 116.2333... => 116.23
      const result = calculateSuggestedRetailPrice(69.74, 0.4);
      expect(result).toBe(116.23);
    });

    it('应在目标毛利率 >= 1 时抛出错误', () => {
      expect(() => calculateSuggestedRetailPrice(50, 1)).toThrow('目标毛利率需在 0~1 之间');
    });

    it('应在目标毛利率为负数时抛出错误', () => {
      expect(() => calculateSuggestedRetailPrice(50, -0.1)).toThrow('目标毛利率需在 0~1 之间');
    });
  });
});
