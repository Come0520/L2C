import { render, screen } from '@testing-library/react';

import { SalesOrderStatus } from '@/types/sales-order-status';

import { StatusBadge } from '../status-badge';

// 不需要 mock STATUS_METADATA，直接测试已知的状态

describe('StatusBadge', () => {
  it('should render with default props', () => {
    const { container } = render(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} />);
    expect(screen.getByText(/待分配/i)).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('should render different statuses with correct text', () => {
    const statusesToTest = [
      { status: SalesOrderStatus.PENDING_ASSIGNMENT, expectedText: /待分配/i },
      { status: SalesOrderStatus.IN_PRODUCTION, expectedText: /生产中/i },
      { status: SalesOrderStatus.PENDING_INVOICE, expectedText: /待开发票/i },
      { status: SalesOrderStatus.CANCELLED, expectedText: /已取消/i },
      { status: SalesOrderStatus.COMPLETED, expectedText: /已完成/i },
    ];
    
    statusesToTest.forEach(({ status, expectedText }) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  it('should render different sizes correctly', () => {
    const { rerender } = render(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} size="sm" />);
    let badge = screen.getByText(/待分配/i).closest('div')!;
    expect(badge).toHaveClass('text-xs');

    rerender(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} size="md" />);
    badge = screen.getByText(/待分配/i).closest('div')!;
    expect(badge).toHaveClass('text-sm');

    rerender(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} size="lg" />);
    badge = screen.getByText(/待分配/i).closest('div')!;
    expect(badge).toHaveClass('text-base');
  });

  it('should not show icon when showIcon is false', () => {
    const { container } = render(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} showIcon={false} />);
    expect(container.querySelector('svg')).toBeFalsy();
  });

  it('should have animated class when animated is true', () => {
    render(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} animated={true} />);
    const badge = screen.getByText(/待分配/i).closest('div')!;
    expect(badge).toHaveClass('animate-pulse-gentle');
  });

  it('should have fadeIn animation by default', () => {
    render(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} />);
    const badge = screen.getByText(/待分配/i).closest('div')!;
    expect(badge).toHaveClass('animate-fadeIn');
  });

  it('should apply custom className', () => {
    const customClass = 'custom-badge-class';
    render(<StatusBadge status={SalesOrderStatus.PENDING_ASSIGNMENT} className={customClass} />);
    const badge = screen.getByText(/待分配/i).closest('div')!;
    expect(badge).toHaveClass(customClass);
  });
});
