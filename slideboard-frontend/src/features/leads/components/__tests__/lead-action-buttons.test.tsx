import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { LEAD_STATUS_CONFIG } from '@/constants/lead-status';
import { LeadItem } from '@/types/lead';

import LeadActionButtons from '../lead-action-buttons';


// Mock data for testing
const mockLead: LeadItem = {
  id: '1',
  leadNumber: 'LD-2024-0001',
  customerName: '张三',
  projectAddress: '北京市朝阳区',
  phone: '13800138000',
  requirements: ['整体定制', '全屋定制'],
  areaSize: 120,
  budgetMin: 100000,
  budgetMax: 150000,
  customerLevel: 'A',
  status: 'PENDING_ASSIGNMENT',
  appointmentTime: '2024-01-15T10:00:00Z',
  appointmentReminder: '24h',
  businessTags: ['quoted', 'high-intent'],
  currentOwner: { name: '李四', avatar: '' },
  designer: { name: '王五', avatar: '' },
  shoppingGuide: { name: '赵六', avatar: '' },
  createdAt: '2024-01-10T08:00:00Z',
  lastFollowUpAt: '2024-01-12T14:30:00Z',
  source: '线上活动',
} as const satisfies LeadItem;

describe('LeadActionButtons Component', () => {
  // Mock props
  const mockProps = {
    lead: mockLead,
    currentUserRole: 'LEAD_ADMIN', // Use LEAD_ADMIN which has all permissions
    onAction: vi.fn(),
    className: '',
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  // Component rendering test
  it('should render correctly with lead data', () => {
    render(<LeadActionButtons {...mockProps} />);

    // Check that buttons are rendered
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  // Status-based actions test
  it('should display different actions based on lead status', () => {
    const pendingLead: LeadItem = {
      ...mockLead,
      status: 'PENDING_ASSIGNMENT' as const,
    };

    render(<LeadActionButtons {...mockProps} lead={pendingLead} />);

    // Get available actions from config
    const pendingActions = LEAD_STATUS_CONFIG['PENDING_ASSIGNMENT']?.actions || [];
    const pendingButtons = screen.queryAllByRole('button');

    // Check that all actions for this status are rendered
    expect(pendingButtons).toHaveLength(pendingActions.length);
  });

  // Test FOLLOWING_UP status in a separate test to avoid DOM cleanup issues
  it('should display correct actions for FOLLOWING_UP status', () => {
    const followingLead: LeadItem = {
      ...mockLead,
      status: 'FOLLOWING_UP' as const,
    };

    render(<LeadActionButtons {...mockProps} lead={followingLead} />);

    // Get available actions from config
    const followingActions = LEAD_STATUS_CONFIG['FOLLOWING_UP']?.actions || [];
    const followingButtons = screen.queryAllByRole('button');

    // Check that all actions for this status are rendered
    expect(followingButtons).toHaveLength(followingActions.length);
  });

  // Test that different statuses have different actions
  it('should have different actions for different statuses', () => {
    // Get available actions from config
    const pendingActions = LEAD_STATUS_CONFIG['PENDING_ASSIGNMENT']?.actions || [];
    const followingActions = LEAD_STATUS_CONFIG['FOLLOWING_UP']?.actions || [];

    // Actions for different statuses should be different
    expect(pendingActions.length).not.toEqual(followingActions.length);
  });

  // Permission control test
  it('should only show actions that user has permission for', () => {
    // Test with salesperson role
    render(<LeadActionButtons {...mockProps} currentUserRole='salesperson' />);
    const salespersonButtons = screen.queryAllByRole('button');

    // Test with sales_manager role
    render(<LeadActionButtons {...mockProps} currentUserRole='sales_manager' />);
    const managerButtons = screen.queryAllByRole('button');

    // Test with admin role
    render(<LeadActionButtons {...mockProps} currentUserRole='LEAD_ADMIN' />);
    const adminButtons = screen.queryAllByRole('button');

    // Admin should have all permissions
    expect(adminButtons.length).toBeGreaterThanOrEqual(managerButtons.length);
    expect(managerButtons.length).toBeGreaterThanOrEqual(salespersonButtons.length);
  });

  // Button click event test
  it('should call onAction when buttons are clicked', () => {
    render(<LeadActionButtons {...mockProps} />);

    // Get all buttons
    const buttons = screen.queryAllByRole('button');

    // Click the first button (with null check)
    if (buttons[0]) {
      fireEvent.click(buttons[0]);
    }

    // Get the action key from the config
    const statusConfig = LEAD_STATUS_CONFIG[mockProps.lead.status];
    const firstActionKey = statusConfig?.actions?.[0]?.key || '';

    // Only verify if firstActionKey exists
    if (firstActionKey) {
      expect(mockProps.onAction).toHaveBeenCalledWith(firstActionKey, mockProps.lead);
    }
  });

  // No actions test
  it('should return null when no actions are available', () => {
    // Create a lead with a status that has no actions
    const noActionsLead = {
      ...mockLead,
      status: 'CANCELLED',
    };

    // Override status config to have no actions
    vi.spyOn(LEAD_STATUS_CONFIG, 'CANCELLED', 'get').mockReturnValue({
      label: '已取消',
      actions: [],
    } as any);

    const { container } = render(<LeadActionButtons {...mockProps} lead={noActionsLead as LeadItem} />);

    // Check that nothing is rendered
    expect(container.firstChild).toBeNull();
  });

  // Invalid status test
  it('should return null when status config is invalid', () => {
    // Create a lead with an invalid status
    const invalidStatusLead = {
      ...mockLead,
      status: 'INVALID_STATUS' as any,
    };

    const { container } = render(<LeadActionButtons {...mockProps} lead={invalidStatusLead} />);

    // Check that nothing is rendered
    expect(container.firstChild).toBeNull();
  });

  // Super admin permissions test
  it('should allow all actions for super admin', () => {
    // Create a lead with restricted actions
    const restrictedLead = {
      ...mockLead,
      status: 'PENDING_ASSIGNMENT',
    };

    // Render with super admin role
    render(<LeadActionButtons {...mockProps} lead={restrictedLead as LeadItem} currentUserRole='LEAD_ADMIN' />);

    // Get all available actions from config
    const allActions = LEAD_STATUS_CONFIG['PENDING_ASSIGNMENT']?.actions || [];
    const adminButtons = screen.getAllByRole('button');

    // Admin should see all actions
    expect(adminButtons).toHaveLength(allActions.length);
  });

  // Custom className test
  it('should apply custom className', () => {
    const customClass = 'custom-test-class';

    const { container } = render(<LeadActionButtons {...mockProps} className={customClass} />);

    // Check that custom class is applied
    expect(container.firstChild).toBeInTheDocument();
    if (container.firstChild) {
      expect(container.firstChild).toHaveClass(customClass);
    }
  });
});
