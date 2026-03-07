/**
 * plan-limits.ts 单元测试
 * 覆盖套餐限额配置的核心工具函数
 */
import { describe, it, expect } from 'vitest';
import {
  PLAN_LIMITS,
  checkLimit,
  getPlanLimit,
  isPlanFeatureEnabled,
  formatLimit,
  type PlanType,
} from '../lib/plan-limits';

describe('PLAN_LIMITS 配置', () => {
  it('免费版用户数上限应为 3', () => {
    expect(PLAN_LIMITS.base.maxUsers).toBe(3);
  });

  it('免费版客户数上限应为 200', () => {
    expect(PLAN_LIMITS.base.maxCustomers).toBe(200);
  });

  it('免费版展厅产品数上限应为 200', () => {
    expect(PLAN_LIMITS.base.maxShowroomProducts).toBe(200);
  });

  it('免费版月报价单数上限应为 50', () => {
    expect(PLAN_LIMITS.base.maxQuotesPerMonth).toBe(50);
  });

  it('专业版月报价单数应为不限（Infinity）', () => {
    expect(PLAN_LIMITS.pro.maxQuotesPerMonth).toBe(Infinity);
  });

  it('企业版所有维度应为不限（Infinity）', () => {
    expect(PLAN_LIMITS.enterprise.maxUsers).toBe(Infinity);
    expect(PLAN_LIMITS.enterprise.maxCustomers).toBe(Infinity);
    expect(PLAN_LIMITS.enterprise.maxQuotesPerMonth).toBe(Infinity);
  });
});

describe('getPlanLimit', () => {
  it('应正确返回免费版用户上限', () => {
    expect(getPlanLimit('base', 'users')).toBe(3);
  });

  it('应正确返回专业版客户上限', () => {
    expect(getPlanLimit('pro', 'customers')).toBe(5_000);
  });

  it('企业版存储上限应为 50GB', () => {
    expect(getPlanLimit('enterprise', 'storageBytes')).toBe(50 * 1024 * 1024 * 1024);
  });
});

describe('isPlanFeatureEnabled', () => {
  it('免费版不应支持数据导出', () => {
    expect(isPlanFeatureEnabled('base', 'dataExport')).toBe(false);
  });

  it('专业版应支持数据导出', () => {
    expect(isPlanFeatureEnabled('pro', 'dataExport')).toBe(true);
  });

  it('免费版不应支持多级审批', () => {
    expect(isPlanFeatureEnabled('base', 'multiLevelApproval')).toBe(false);
  });

  it('企业版应支持 API 访问', () => {
    expect(isPlanFeatureEnabled('enterprise', 'apiAccess')).toBe(true);
  });

  it('专业版不应支持多门店', () => {
    expect(isPlanFeatureEnabled('pro', 'multiStore')).toBe(false);
  });
});

describe('checkLimit', () => {
  it('用量未达上限时 allowed 应为 true', () => {
    const result = checkLimit('base', 'users', 2);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(2);
    expect(result.limit).toBe(3);
    expect(result.planType).toBe('base');
  });

  it('用量恰好等于上限时 allowed 应为 false（已满不能再加）', () => {
    const result = checkLimit('base', 'users', 3);
    expect(result.allowed).toBe(false);
  });

  it('用量超过上限时 allowed 应为 false', () => {
    const result = checkLimit('base', 'customers', 250);
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(250);
    expect(result.limit).toBe(200);
  });

  it('专业版不限报价单时 allowed 应始终为 true', () => {
    const result = checkLimit('pro', 'quotesPerMonth', 99999);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  it('专业版不限订单时 allowed 应始终为 true', () => {
    const result = checkLimit('pro', 'ordersPerMonth', 50000);
    expect(result.allowed).toBe(true);
  });

  it('企业版任何资源都应 allowed=true', () => {
    const resources = [
      'users',
      'customers',
      'quotesPerMonth',
      'ordersPerMonth',
      'showroomProducts',
      'storageBytes',
    ] as const;
    for (const resource of resources) {
      const result = checkLimit('enterprise', resource, 999999);
      expect(result.allowed).toBe(true);
    }
  });
});

describe('formatLimit', () => {
  it('Infinity 应格式化为"不限"', () => {
    expect(formatLimit(Infinity)).toBe('不限');
  });

  it('字节数 ≥ 1GB 应显示 GB 单位', () => {
    expect(formatLimit(5 * 1024 * 1024 * 1024)).toBe('5GB');
  });

  it('字节数 ≥ 1MB 应显示 MB 单位', () => {
    expect(formatLimit(500 * 1024 * 1024)).toBe('500MB');
  });

  it('普通数字应正常显示', () => {
    expect(formatLimit(200)).toBe('200');
  });
});

describe('所有套餐均有完整字段', () => {
  const planTypes: PlanType[] = ['base', 'pro', 'enterprise'];

  for (const plan of planTypes) {
    it(`${plan} 套餐应具备完整 features 对象`, () => {
      const config = PLAN_LIMITS[plan];
      expect(config.features).toBeDefined();
      expect(typeof config.features.dataExport).toBe('boolean');
      expect(typeof config.features.multiLevelApproval).toBe('boolean');
      expect(typeof config.features.brandCustomization).toBe('boolean');
      expect(typeof config.features.advancedAnalytics).toBe('boolean');
      expect(typeof config.features.apiAccess).toBe('boolean');
      expect(typeof config.features.multiStore).toBe('boolean');
    });
  }
});
