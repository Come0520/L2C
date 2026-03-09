/**
 * 平台 - 套餐管理页面 TDD 测试
 *
 * RED 阶段：在页面实现之前先写好所有测试，运行后均应失败。
 * 覆盖范围：
 * - 三个套餐卡片（Base/Pro/Enterprise）均能渲染
 * - 每个套餐卡片显示 功能限额（员工上限、存储上限、AI 积分）
 * - 空状态（无租户订阅某套餐）
 * - 租户列表中 planType 相关展示
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mock 路由 ─────────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// ── 套餐配置常量（与实现保持一致）───────────────────────────────────────────
const PLAN_CONFIG = {
    base: {
        name: 'Base 基础版',
        maxEmployees: 10,
        maxStorageGb: 5,
        aiCreditsPerMonth: 50,
        price: 0,
    },
    pro: {
        name: 'Pro 专业版',
        maxEmployees: 50,
        maxStorageGb: 50,
        aiCreditsPerMonth: 500,
        price: 2999,
    },
    enterprise: {
        name: 'Enterprise 旗舰版',
        maxEmployees: -1, // 无限制
        maxStorageGb: -1, // 无限制
        aiCreditsPerMonth: -1, // 无限制
        price: 9999,
    },
};

// ── 构造租户数据（带 planType）─────────────────────────────────────────────
const makeTenantWithPlan = (
    planType: 'base' | 'pro' | 'enterprise',
    overrides: Record<string, unknown> = {}
) => ({
    id: `tenant-${Math.random()}`,
    name: `${planType} 租户`,
    code: `CODE${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    status: 'active',
    planType,
    planExpiresAt: null,
    createdAt: new Date('2026-01-01'),
    ...overrides,
});

// ── 测试套件 ─────────────────────────────────────────────────────────────────

describe('PlanManagementPage - 套餐管理页面组件', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 1. 套餐卡片渲染 ───────────────────────────────────────────────────────
    describe('套餐配置卡片', () => {
        it('应渲染三个套餐卡片', async () => {
            const { PlanManagementClient } = await import(
                '@/features/platform/components/plan-management-client'
            );
            render(
                <PlanManagementClient
                    tenants={[]}
                    planConfig={PLAN_CONFIG}
                />
            );
            expect(screen.getByText(/Base 基础版/i)).toBeDefined();
            expect(screen.getByText(/Pro 专业版/i)).toBeDefined();
            expect(screen.getByText(/Enterprise 旗舰版/i)).toBeDefined();
        });

        it('Base 套餐应显示员工上限 10 人', async () => {
            const { PlanManagementClient } = await import(
                '@/features/platform/components/plan-management-client'
            );
            render(
                <PlanManagementClient
                    tenants={[]}
                    planConfig={PLAN_CONFIG}
                />
            );
            // 10 人 或 10名员工（可能有多个包含数字10的元素）
            const els = screen.getAllByText(/10 人/);
            expect(els.length).toBeGreaterThan(0);
        });

        it('Enterprise 套餐应显示"无限制"或"∞"标志', async () => {
            const { PlanManagementClient } = await import(
                '@/features/platform/components/plan-management-client'
            );
            render(
                <PlanManagementClient
                    tenants={[]}
                    planConfig={PLAN_CONFIG}
                />
            );
            // 无限制 或 ∞ 符号（Enterprise 有多个无限制字段）
            const els = screen.getAllByText(/无限制|∞/);
            expect(els.length).toBeGreaterThan(0);
        });
    });

    // ── 2. 租户订阅统计 ───────────────────────────────────────────────────────
    describe('套餐订阅统计', () => {
        it('应正确统计各套餐的租户数量', async () => {
            const { PlanManagementClient } = await import(
                '@/features/platform/components/plan-management-client'
            );
            const tenants = [
                makeTenantWithPlan('base'),
                makeTenantWithPlan('base'),
                makeTenantWithPlan('pro'),
                makeTenantWithPlan('enterprise'),
            ];
            render(
                <PlanManagementClient
                    tenants={tenants}
                    planConfig={PLAN_CONFIG}
                />
            );
            // Base 套餐应显示 2 个订阅租户（可以是"2家"、"2个租户"等）
            expect(screen.getAllByText(/2\s*(家|个|户)?/).length).toBeGreaterThan(0);
        });

        it('无租户时每个套餐徽章应显示 0 家', async () => {
            const { PlanManagementClient } = await import(
                '@/features/platform/components/plan-management-client'
            );
            // 使用 data-testid 会更稳定，这里用 getAllByText 匹配 "0 家" 即可
            render(
                <PlanManagementClient
                    tenants={[]}
                    planConfig={PLAN_CONFIG}
                />
            );
            // 三个套餐各 0 家 → 应出现 3 次 "0 家"
            const badges = screen.getAllByText(/0 \u5bb6/);
            expect(badges.length).toBeGreaterThanOrEqual(3);
        });
    });

    // ── 3. 页面标题 ───────────────────────────────────────────────────────────
    describe('页面基础元素', () => {
        it('应渲染"套餐管理"页面标题', async () => {
            const { PlanManagementClient } = await import(
                '@/features/platform/components/plan-management-client'
            );
            render(
                <PlanManagementClient
                    tenants={[]}
                    planConfig={PLAN_CONFIG}
                />
            );
            expect(screen.getByRole('heading', { name: /套餐管理/i })).toBeDefined();
        });
    });
});
