import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { FinanceOnly } from '@/features/orders/components/permissions/finance-only';
import { InstallerOnly } from '@/features/orders/components/permissions/installer-only';
import { MeasurerOnly } from '@/features/orders/components/permissions/measurer-only';
import { RoleGuard } from '@/features/orders/components/permissions/role-guard';
import { ServiceDispatchOnly } from '@/features/orders/components/permissions/service-dispatch-only';

let mockUserRole: any = undefined;
let mockLoading = false;

vi.mock('@/contexts/auth-context', () => {
  return {
    useAuth: () => ({
      user: mockUserRole ? { id: 'u', phone: '13800000000', name: 'tester', role: mockUserRole } : null,
      loading: mockLoading,
    }),
  };
});

describe('RoleGuard', () => {
  beforeEach(() => {
    mockUserRole = undefined;
    mockLoading = false;
  });

  it('shows skeleton during loading when showFallbackWhileLoading is false', () => {
    mockLoading = true;
    render(
      <RoleGuard roles="OTHER_FINANCE">
        <div>content</div>
      </RoleGuard>
    );
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('shows fallback during loading when showFallbackWhileLoading is true', () => {
    mockLoading = true;
    render(
      <RoleGuard roles="OTHER_FINANCE" showFallbackWhileLoading fallback={<div>loading...</div>}>
        <div>content</div>
      </RoleGuard>
    );
    expect(screen.getByText('loading...')).toBeInTheDocument();
  });

  it('renders children when role allowed', () => {
    mockUserRole = 'OTHER_FINANCE';
    render(
      <RoleGuard roles={["OTHER_FINANCE", "APPROVER_FINANCIAL"]}>
        <div>secure</div>
      </RoleGuard>
    );
    expect(screen.getByText('secure')).toBeInTheDocument();
  });

  it('renders fallback when role not allowed', () => {
    mockUserRole = 'SERVICE_INSTALL';
    render(
      <RoleGuard roles={["OTHER_FINANCE", "APPROVER_FINANCIAL"]} fallback={<div>no access</div>}>
        <div>secure</div>
      </RoleGuard>
    );
    expect(screen.getByText('no access')).toBeInTheDocument();
  });
});

describe('Permission wrappers', () => {
  it('FinanceOnly shows content for finance role', () => {
    mockUserRole = 'OTHER_FINANCE';
    render(
      <FinanceOnly>
        <div>finance content</div>
      </FinanceOnly>
    );
    expect(screen.getByText('finance content')).toBeInTheDocument();
  });

  it('FinanceOnly shows fallback for non-finance role', () => {
    mockUserRole = 'SERVICE_INSTALL';
    render(
      <FinanceOnly fallback={<div>blocked</div>}>
        <div>finance content</div>
      </FinanceOnly>
    );
    expect(screen.getByText('blocked')).toBeInTheDocument();
  });

  it('InstallerOnly allows SERVICE_INSTALL', () => {
    mockUserRole = 'SERVICE_INSTALL';
    render(
      <InstallerOnly>
        <div>install content</div>
      </InstallerOnly>
    );
    expect(screen.getByText('install content')).toBeInTheDocument();
  });

  it('MeasurerOnly allows SERVICE_MEASURE', () => {
    mockUserRole = 'SERVICE_MEASURE';
    render(
      <MeasurerOnly>
        <div>measure content</div>
      </MeasurerOnly>
    );
    expect(screen.getByText('measure content')).toBeInTheDocument();
  });

  it('ServiceDispatchOnly allows SERVICE_DISPATCH', () => {
    mockUserRole = 'SERVICE_DISPATCH';
    render(
      <ServiceDispatchOnly>
        <div>dispatch content</div>
      </ServiceDispatchOnly>
    );
    expect(screen.getByText('dispatch content')).toBeInTheDocument();
  });
});
