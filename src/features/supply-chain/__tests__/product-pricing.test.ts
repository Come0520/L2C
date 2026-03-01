import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import {
  calculateProductCost,
  analyzeProductProfit,
  calculateChannelPrice,
} from '../actions/product-pricing';

// ---- Mock Modules ----
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { mockDbQuery } = vi.hoisted(() => {
  return {
    mockDbQuery: {
      products: {
        findFirst: vi.fn(),
      },
      productSuppliers: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock('@/shared/api/db', () => ({
  db: {
    query: mockDbQuery,
  },
}));

describe('Product Pricing Actions', () => {
  const mockSession = { user: { id: 'u1', tenantId: 't1', role: 'ADMIN' } };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue(mockSession);
  });

  describe('calculateProductCost', () => {
    it('should require authentication', async () => {
      (auth as any).mockResolvedValue(null);
      await expect(calculateProductCost('p1')).rejects.toThrow('未授权');
    });

    it('should throw if product is not found', async () => {
      mockDbQuery.products.findFirst.mockResolvedValueOnce(undefined);
      await expect(calculateProductCost('p1')).rejects.toThrow('产品不存在或无权访问');
    });

    it('should calculate cost properly using product default purchasePrice', async () => {
      mockDbQuery.products.findFirst.mockResolvedValueOnce({
        id: 'p1',
        purchasePrice: '80',
        logisticsCost: '5.5',
        processingCost: '10.0',
        lossRate: '0.1', // 10% 损耗
      });

      const result = await calculateProductCost('p1');

      expect(result.purchaseCost).toBe(80);
      expect(result.logisticsCost).toBe(5.5);
      expect(result.processingCost).toBe(10);
      expect(result.lossCost).toBe(8); // 80 * 0.1
      expect(result.totalCost).toBe(80 + 5.5 + 10 + 8); // 103.5
    });

    it('should prioritize specified supplier purchasePrice', async () => {
      mockDbQuery.products.findFirst.mockResolvedValueOnce({
        id: 'p1',
        purchasePrice: '80', // Should be ignored
        logisticsCost: '0',
        processingCost: '0',
        lossRate: '0',
      });

      mockDbQuery.productSuppliers.findFirst.mockResolvedValueOnce({
        purchasePrice: '100',
      });

      const result = await calculateProductCost('p1', 's1');
      expect(result.purchaseCost).toBe(100);
      expect(result.totalCost).toBe(100);
      expect(mockDbQuery.productSuppliers.findFirst).toHaveBeenCalled();
    });

    it('should fallback to 0 if data missing', async () => {
      mockDbQuery.products.findFirst.mockResolvedValueOnce({
        id: 'p1',
      });

      const result = await calculateProductCost('p1');
      expect(result.purchaseCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });
  });

  describe('analyzeProductProfit', () => {
    it('should analyze profit correctly given sellingPrice', async () => {
      mockDbQuery.products.findFirst.mockResolvedValueOnce({
        id: 'p1',
        purchasePrice: '50',
        logisticsCost: '5',
        processingCost: '0',
        lossRate: '0.1', // 损耗 50 * 0.1 = 5, total cost = 50 + 5 + 5 = 60
      });

      const result = await analyzeProductProfit('p1', 200);

      expect(result.cost.totalCost).toBe(60);
      expect(result.basePrice).toBe(200);

      // profit = retail 200 - cost 60 = 140
      expect(result.margin).toBe(140);
      // margin = 140 / 200 = 0.70 (70%)
      expect(result.marginRate).toBeCloseTo(0.7, 2);
    });
  });

  describe('calculateChannelPrice', () => {
    it('should return fixed price directly', () => {
      const price = calculateChannelPrice(100, 'FIXED', 88, 0.5);
      expect(price).toBe(88);
    });

    it('should return discounted price correctly', () => {
      const price = calculateChannelPrice(100, 'DISCOUNT', 0, 0.85); // 85%
      expect(price).toBe(85);
    });

    it('should default to basePrice if fixed price missing in FIXED mode', () => {
      const price = calculateChannelPrice(100, 'FIXED');
      expect(price).toBe(100);
    });

    it('should default to basePrice if rate missing in DISCOUNT mode', () => {
      const price = calculateChannelPrice(100, 'DISCOUNT');
      expect(price).toBe(100);
    });
  });
});
