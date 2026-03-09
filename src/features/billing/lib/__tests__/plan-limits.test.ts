import { describe, expect, it } from 'vitest';
import { getTenantPlanLimits, TenantOverride } from '../plan-limits';

describe('plan-limits', () => {
    describe('getTenantPlanLimits', () => {
        it('基础版租户无任何附加包时，应该返回基础版原始配置', () => {
            const result = getTenantPlanLimits({
                planType: 'base',
                purchasedAddons: {},
            });
            expect(result.maxUsers).toBe(5);
            expect(result.maxAiRenderingCredits).toBe(50);
            expect(result.features.dataExport).toBe(false);
        });

        it('当租户购买了 usersLimitBonus 扩容包时，额度应该累加', () => {
            // 假设 base 版最初有 5 人限制（尽管最新设计改成了不限，但假设我们有一个受限制的维度如 AI 积分）
            const result = getTenantPlanLimits({
                planType: 'base',
                purchasedAddons: {
                    aiCreditsBonus: 100,
                },
            });
            expect(result.maxAiRenderingCredits).toBe(150); // Base 50 + 100 = 150
        });

        it('对于字符串参数或旧的不含 purchasedAddons 的配置，也能兼容运行', () => {
            const result = getTenantPlanLimits('pro');
            expect(result.maxAiRenderingCredits).toBe(500);
            expect(result.features.dataExport).toBe(true);
        });

        it('当购买了功能模块时，相关布尔开关应被开启', () => {
            const result = getTenantPlanLimits({
                planType: 'base',
                purchasedAddons: {},
                purchasedModules: ['BRANDING', 'ADVANCED_APPROVAL'],
            });
            expect(result.features.brandCustomization).toBe(true);
            expect(result.features.multiLevelApproval).toBe(true);
        });
    });
});
