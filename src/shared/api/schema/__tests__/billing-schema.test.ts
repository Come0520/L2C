import { getTableName } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { tenants } from '../infrastructure';
import { planDefinitions, tenantMonthlyUsages, aiCreditTransactions } from '../billing';

describe('Billing Schema extensions', () => {
    describe('tenants table modifications', () => {
        it('应包含 purchasedAddons 字段 (JSONB)', () => {
            const columns = Object.keys(tenants);
            expect(columns).toContain('purchasedAddons');
        });
    });

    describe('planDefinitions 定价计划快照表', () => {
        it('表名应为 plan_definitions', () => {
            expect(getTableName(planDefinitions)).toBe('plan_definitions');
        });

        it('应包含控制计费所需的关键字段', () => {
            const columns = Object.keys(planDefinitions);
            expect(columns).toContain('id');
            expect(columns).toContain('code'); // 'pro_2026_q1'
            expect(columns).toContain('price');
            expect(columns).toContain('limitsJson'); // JSONB limits
            expect(columns).toContain('isActive');
            expect(columns).toContain('createdAt');
        });
    });

    describe('tenantMonthlyUsages 租户月度用量表', () => {
        it('表名应为 tenant_monthly_usages', () => {
            expect(getTableName(tenantMonthlyUsages)).toBe('tenant_monthly_usages');
        });

        it('应包含计量所需的关键字段', () => {
            const columns = Object.keys(tenantMonthlyUsages);
            expect(columns).toContain('id');
            expect(columns).toContain('tenantId');
            expect(columns).toContain('month'); // e.g., '2026-03'
            expect(columns).toContain('resourceType'); // e.g., 'quotes', 'customers'
            expect(columns).toContain('usedValue');
            expect(columns).toContain('createdAt');
            expect(columns).toContain('updatedAt');
        });
    });

    describe('aiCreditTransactions 积分流转账单表', () => {
        it('表名应为 ai_credit_transactions', () => {
            expect(getTableName(aiCreditTransactions)).toBe('ai_credit_transactions');
        });

        it('应包含资产流水记录所需的关键字段', () => {
            const columns = Object.keys(aiCreditTransactions);
            expect(columns).toContain('id');
            expect(columns).toContain('tenantId');
            expect(columns).toContain('type'); // 'PLEDGE', 'ADDON', 'CONSUME', 'REFUND'
            expect(columns).toContain('amount');
            expect(columns).toContain('balance');
            expect(columns).toContain('reason');
            expect(columns).toContain('createdAt');
        });
    });
});
