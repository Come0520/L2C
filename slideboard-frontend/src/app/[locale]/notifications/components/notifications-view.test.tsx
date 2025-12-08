import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import NotificationsView, { Notification, ApprovalRequest } from './notifications-view';

// Mock child components with compatible props
vi.mock('@/components/ui/paper-card', () => ({
  PaperCard: ({ children }: { children: React.ReactNode }) => <div data-testid="paper-card">{children}</div>,
  PaperCardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="paper-card-header">{children}</div>,
  PaperCardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="paper-card-title">{children}</div>,
  PaperCardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="paper-card-content">{children}</div>,
}));

vi.mock('@/components/ui/paper-modal', () => ({
  PaperModal: ({ children }: { children: React.ReactNode }) => <div data-testid="paper-modal">{children}</div>,
}));

vi.mock('@/components/ui/paper-button', () => ({
  PaperButton: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/paper-input', () => ({
  PaperInput: ({ onChange, ...props }: any) => (
    <input onChange={onChange} {...props} />
  ),
}));

// Mock list components to avoid deep rendering issues
vi.mock('./notification-list', () => ({
  default: ({ notifications }: { notifications: Notification[] }) => (
    <div data-testid="notification-list">
      {notifications.map(n => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  ),
}));

vi.mock('./approval-list', () => ({
  default: ({ approvals }: { approvals: ApprovalRequest[] }) => (
    <div data-testid="approval-list">
      {approvals.map(a => (
        <div key={a.id}>{a.title}</div>
      ))}
    </div>
  ),
}));

// Mock filter component
vi.mock('./notification-filters', () => ({
  default: ({ searchTerm, onSearchChange }: any) => (
    <input 
      data-testid="search-input"
      placeholder="搜索..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
    />
  ),
}));

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Test Notification 1',
    content: 'Content 1',
    type: 'info',
    priority: 'medium',
    sender: 'System',
    recipient: 'User',
    createdAt: '2024-01-01',
    status: 'unread',
  },
  {
    id: '2',
    title: 'Test Notification 2',
    content: 'Content 2',
    type: 'warning',
    priority: 'high',
    sender: 'System',
    recipient: 'User',
    createdAt: '2024-01-02',
    status: 'read',
  },
];

const mockApprovals: ApprovalRequest[] = [
  {
    id: '1',
    title: 'Test Approval 1',
    description: 'Description 1',
    type: 'expense',
    requester: 'Requester 1',
    requesterDepartment: 'Dept 1',
    submittedAt: '2024-01-01',
    status: 'pending',
    priority: 'medium',
    currentStep: 1,
    totalSteps: 2,
    approvers: [],
  },
];

describe('NotificationsView', () => {
  it('should render notifications tab by default', () => {
    render(
      <NotificationsView
        initialNotifications={mockNotifications}
        initialApprovals={mockApprovals}
      />
    );

    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Test Notification 2')).toBeInTheDocument();
  });

  it('should switch to approvals tab', () => {
    render(
      <NotificationsView
        initialNotifications={mockNotifications}
        initialApprovals={mockApprovals}
      />
    );

    const approvalsTab = screen.getByText('审批申请');
    fireEvent.click(approvalsTab);

    expect(screen.getByText('Test Approval 1')).toBeInTheDocument();
  });

  it('should filter notifications by search term', () => {
    render(
      <NotificationsView
        initialNotifications={mockNotifications}
        initialApprovals={mockApprovals}
      />
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Notification 1' } });

    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Notification 2')).not.toBeInTheDocument();
  });

  it('should display unread count correctly', () => {
    render(
      <NotificationsView
        initialNotifications={mockNotifications}
        initialApprovals={mockApprovals}
      />
    );

    // Check page header badge
    const headerBadge = screen.getByText('1', { selector: '.bg-paper-primary.text-white' });
    expect(headerBadge).toBeInTheDocument();
  });
});
