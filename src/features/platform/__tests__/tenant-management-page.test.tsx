/**
 * 平台 - 租户管理页面 TDD 测试
 *
 * 覆盖范围：
 * - 页面标题渲染
 * - 空状态展示
 * - 租户列表渲染（名称、状态标签、助记码）
 * - 统计数字展示（总量、活跃数、暂停数）
 * - 用 data-status 属性验证各状态徽章
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mock server actions ──────────────────────────────────────────────────────
vi.mock('@/features/platform/actions/admin-actions', () => ({
    getAllTenants: vi.fn().mockResolvedValue({ success: true, data: { tenants: [], total: 0 } }),
    suspendTenant: vi.fn().mockResolvedValue({ success: true }),
    activateTenant: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/features/platform/actions/platform-analytics', () => ({
    getPlatformOverview: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// ── 测试夹具 ─────────────────────────────────────────────────────────────────

const makeTenant = (overrides: Record<string, unknown> = {}) => ({
    id: 'tenant-001',
    name: 'TestCorp Ltd',
    code: 'TEST001',
    applicantName: 'Zhang San',
    applicantPhone: '13800138000',
    applicantEmail: 'test@example.com',
    region: 'Hangzhou',
    businessDescription: 'AI Research',
    createdAt: new Date('2026-01-01'),
    status: 'active',
    ...overrides,
});

const makeOverview = (overrides: Record<string, unknown> = {}) => ({
    totalTenants: 10,
    activeTenants: 7,
    pendingTenants: 2,
    suspendedTenants: 1,
    ...overrides,
});

// ── 测试套件 ─────────────────────────────────────────────────────────────────

describe('TenantManagementPage - 租户管理页面组件', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 1. 基础渲染 ──────────────────────────────────────────────────────────
    describe('基础渲染', () => {
        it('应渲染页面标题', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            render(
                <TenantManagementClient
                    initialTenants={[makeTenant()]}
                    initialTotal={1}
                    overview={makeOverview()}
                />
            );
            // "租户管理" 标题节点
            const heading = screen.getByRole('heading');
            expect(heading).not.toBeNull();
        });

        it('租户总数统计应显示正确数字 42', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            render(
                <TenantManagementClient
                    initialTenants={[makeTenant()]}
                    initialTotal={1}
                    overview={makeOverview({ totalTenants: 42 })}
                />
            );
            expect(screen.getByText('42')).not.toBeNull();
        });

        it('活跃租户数统计应正确显示', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            render(
                <TenantManagementClient
                    initialTenants={[makeTenant()]}
                    initialTotal={1}
                    overview={makeOverview({ activeTenants: 7 })}
                />
            );
            expect(screen.getByText('7')).not.toBeNull();
        });
    });

    // ── 2. 空状态 ─────────────────────────────────────────────────────────────
    describe('空数据状态', () => {
        it('无租户时应显示空状态提示', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            const { container } = render(
                <TenantManagementClient
                    initialTenants={[]}
                    initialTotal={0}
                    overview={makeOverview({ totalTenants: 0, activeTenants: 0 })}
                />
            );
            // 空状态用 data-testid 标记
            const emptyState = container.querySelector('[data-testid="empty-state"]');
            expect(emptyState).not.toBeNull();
        });
    });

    // ── 3. 租户列表渲染 ───────────────────────────────────────────────────────
    describe('租户列表渲染', () => {
        it('应显示租户名称', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            render(
                <TenantManagementClient
                    initialTenants={[makeTenant({ name: 'TestCorp Ltd' })]}
                    initialTotal={1}
                    overview={makeOverview()}
                />
            );
            expect(screen.getByText('TestCorp Ltd')).not.toBeNull();
        });

        it('active 状态应有 data-status="active" 徽章', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            const { container } = render(
                <TenantManagementClient
                    initialTenants={[makeTenant({ status: 'active' })]}
                    initialTotal={1}
                    overview={makeOverview()}
                />
            );
            const badge = container.querySelector('[data-status="active"]');
            expect(badge).not.toBeNull();
        });

        it('suspended 状态应有 data-status="suspended" 徽章', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            const { container } = render(
                <TenantManagementClient
                    initialTenants={[makeTenant({ status: 'suspended' })]}
                    initialTotal={1}
                    overview={makeOverview()}
                />
            );
            const badge = container.querySelector('[data-status="suspended"]');
            expect(badge).not.toBeNull();
        });

        it('pending_approval 状态应有 data-status="pending_approval" 徽章', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            const { container } = render(
                <TenantManagementClient
                    initialTenants={[makeTenant({ status: 'pending_approval' })]}
                    initialTotal={1}
                    overview={makeOverview()}
                />
            );
            const badge = container.querySelector('[data-status="pending_approval"]');
            expect(badge).not.toBeNull();
        });

        it('应显示租户助记码', async () => {
            const { TenantManagementClient } = await import(
                '@/features/platform/components/tenant-management-client'
            );
            render(
                <TenantManagementClient
                    initialTenants={[makeTenant({ code: 'MYCODE' })]}
                    initialTotal={1}
                    overview={makeOverview()}
                />
            );
            expect(screen.getByText('MYCODE')).not.toBeNull();
        });
    });
});
