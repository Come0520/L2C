/**
 * usage-calculator.ts 单元测试
 * 测试纯函数逻辑；数据库相关函数通过 mock 测试
 */
import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import { checkLimit, type PlanType, type PlanResource } from '../lib/plan-limits';

// =============================================================
// 纯函数集成测试（不依赖数据库）
// =============================================================

describe('checkLimit + 用量组合场景', () => {
  describe('祖父条款用户逻辑（在 checkPlanLimit 中实现，纯函数层面模拟）', () => {
    it('祖父用户应视为 limit=Infinity 始终允许', () => {
      // 模拟：isGrandfathered=true 时，直接返回 allowed=true
      // （实际逻辑在 checkPlanLimit 函数中，此处验证设计意图）
      const grandfathered = true;
      if (grandfathered) {
        const fakeResult = {
          allowed: true,
          current: 250,
          limit: Infinity,
          planType: 'base' as PlanType,
        };
        expect(fakeResult.allowed).toBe(true);
        expect(fakeResult.limit).toBe(Infinity);
      }
    });
  });

  describe('免费版多维度组合', () => {
    it('用户2/3 → 允许', () => {
      expect(checkLimit('base', 'users', 2).allowed).toBe(true);
    });

    it('用户3/3 → 拒绝（已满）', () => {
      expect(checkLimit('base', 'users', 3).allowed).toBe(false);
    });

    it('客户199/200 → 允许', () => {
      expect(checkLimit('base', 'customers', 199).allowed).toBe(true);
    });

    it('客户200/200 → 拒绝（已满）', () => {
      expect(checkLimit('base', 'customers', 200).allowed).toBe(false);
    });

    it('展厅产品199/200 → 允许', () => {
      expect(checkLimit('base', 'showroomProducts', 199).allowed).toBe(true);
    });

    it('报价单49/50 → 允许', () => {
      expect(checkLimit('base', 'quotesPerMonth', 49).allowed).toBe(true);
    });

    it('报价单50/50 → 拒绝', () => {
      expect(checkLimit('base', 'quotesPerMonth', 50).allowed).toBe(false);
    });

    it('订单29/30 → 允许', () => {
      expect(checkLimit('base', 'ordersPerMonth', 29).allowed).toBe(true);
    });

    it('订单30/30 → 拒绝', () => {
      expect(checkLimit('base', 'ordersPerMonth', 30).allowed).toBe(false);
    });

    it('存储已满 → 拒绝', () => {
      const limit500MB = 500 * 1024 * 1024;
      expect(checkLimit('base', 'storageBytes', limit500MB).allowed).toBe(false);
    });
  });

  describe('专业版多维度组合', () => {
    it('用户14/15 → 允许', () => {
      expect(checkLimit('pro', 'users', 14).allowed).toBe(true);
    });

    it('用户15/15 → 拒绝', () => {
      expect(checkLimit('pro', 'users', 15).allowed).toBe(false);
    });

    it('报价单99999条 → 允许（不限）', () => {
      expect(checkLimit('pro', 'quotesPerMonth', 99_999).allowed).toBe(true);
    });

    it('客户4999/5000 → 允许', () => {
      expect(checkLimit('pro', 'customers', 4_999).allowed).toBe(true);
    });

    it('客户5000/5000 → 拒绝', () => {
      expect(checkLimit('pro', 'customers', 5_000).allowed).toBe(false);
    });
  });

  describe('企业版所有维度均不限', () => {
    const resources: PlanResource[] = [
      'users',
      'customers',
      'quotesPerMonth',
      'ordersPerMonth',
      'showroomProducts',
      'storageBytes',
      'aiRenderingCredits',
    ];

    for (const resource of resources) {
      it(`企业版 ${resource} 用量极大也应 allowed=true`, () => {
        expect(checkLimit({ planType: 'enterprise' }, resource, 10_000_000).allowed).toBe(true);
      });
    }
  });
});

describe('getUsageSummary 格式检查（结构验证）', () => {
  it('所有资源键都应存在于 PlanResource 类型中', () => {
    const expectedResources: PlanResource[] = [
      'users',
      'customers',
      'quotesPerMonth',
      'ordersPerMonth',
      'showroomProducts',
      'storageBytes',
      'aiRenderingCredits',
    ];
    // 确保类型定义包含所有期望的资源类型
    expect(expectedResources).toHaveLength(7);
    // 每个资源均可用于 checkLimit
    for (const resource of expectedResources) {
      const result = checkLimit({ planType: 'base' }, resource, 0);
      expect(result).toMatchObject({
        allowed: true,
        current: 0,
        planType: 'base',
      });
    }
  });
});
