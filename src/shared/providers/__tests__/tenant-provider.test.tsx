import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Mock 必须在 import 被解析前声明（vi.hoisted 确保提升）
 * 避免 tenant-provider.tsx -> tenant-info -> db.ts -> DATABASE_URL 链式错误
 */
vi.mock('@/shared/config/env', () => ({
  env: { DATABASE_URL: 'mock-url', DB_MAX_CONNECTIONS: 1, DB_SSL: 'false' },
}));
vi.mock('@/shared/api/db', () => ({
  db: {},
}));
vi.mock('@/features/settings/actions/tenant-info', () => ({
  getTenantInfo: vi.fn().mockResolvedValue({ success: false }),
  getVerificationStatus: vi.fn().mockResolvedValue({ success: false }),
}));

import { TenantProvider, useTenant } from '../tenant-provider';

/**
 * Mock next-auth/react
 * 模拟已登录状态，session 中有 tenantId
 */
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { tenantId: 't-1', id: 'user-1' } },
    status: 'authenticated',
  })),
}));

/**
 * 测试用消费组件，渲染 tenant 状态
 */
function TestConsumer() {
  const { tenant, isLoading } = useTenant();
  if (isLoading) return <div data-testid="loading">loading</div>;
  return <div data-testid="tenant-name">{tenant?.name ?? 'none'}</div>;
}

describe('TenantProvider', () => {
  it('未传 initialTenant 时应显示 loading 状态', () => {
    render(
      <TenantProvider>
        <TestConsumer />
      </TenantProvider>
    );
    // 未传初始数据时，客户端会发请求，处于 loading 状态
    expect(screen.getByTestId('loading')).toBeDefined();
  });

  it('传入 initialTenant 时应跳过客户端请求，直接渲染租户名', () => {
    const initialTenant = {
      id: 't-1',
      name: '测试租户',
      code: 'TEST',
    };

    render(
      <TenantProvider initialTenant={initialTenant}>
        <TestConsumer />
      </TenantProvider>
    );

    // 传入服务端数据后，应立即渲染，不出现 loading 状态
    expect(screen.queryByTestId('loading')).toBeNull();
    expect(screen.getByTestId('tenant-name').textContent).toBe('测试租户');
  });
});
