import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { LeadItem } from '@/types/lead';

import { LeadTable } from '../lead-table';


// Mock data for testing
const mockLeads: LeadItem[] = [
  {
    id: '1',
    leadNumber: 'LD-2024-0001',
    customerName: '张三',
    projectAddress: '北京市朝阳区',
    requirements: ['整体定制', '全屋定制'],
    areaSize: 120,
    budgetMin: 30000,
    budgetMax: 50000,
    customerLevel: 'A',
    status: 'PENDING_ASSIGNMENT',
    appointmentTime: '2024-01-15T10:00:00Z',
    appointmentReminder: '24h',
    businessTags: ['quoted', 'high-intent'],
    currentOwner: { name: '李四', avatar: '' },
    designer: { name: '王五', avatar: '' },
    shoppingGuide: { name: '赵六', avatar: '' },
    createdAt: '2024-01-10T08:00:00Z',
    lastFollowUpAt: '2024-01-10T08:00:00Z',
    source: 'online',
    phone: '13800138001',
  },
  {
    id: '2',
    leadNumber: 'LD-2024-0002',
    customerName: '李四',
    projectAddress: '上海市浦东新区',
    requirements: ['厨房定制', '衣柜定制'],
    areaSize: 80,
    budgetMin: 50000,
    budgetMax: 80000,
    customerLevel: 'B',
    status: 'FOLLOWING_UP',
    appointmentTime: '2024-01-16T14:00:00Z',
    appointmentReminder: '48h',
    businessTags: ['arrived'],
    currentOwner: { name: '钱七', avatar: '' },
    designer: undefined,
    shoppingGuide: { name: '孙八', avatar: '' },
    createdAt: '2024-01-11T09:30:00Z',
    lastFollowUpAt: '2024-01-11T09:30:00Z',
    source: 'offline',
    phone: '13800138002',
  },
];

describe('LeadTable Component', () => {
  // Mock props
  const mockProps = {
    leads: mockLeads,
    totalItems: 2,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
    onItemsPerPageChange: vi.fn(),
    onAction: vi.fn(),
    isLoading: false,
    currentUserRole: 'sales_manager',
    onToolbarAction: vi.fn(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  // Component rendering test
  it('should render correctly with leads data', () => {
    render(<LeadTable {...mockProps} />);
    
    // Check table structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(9);
    expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 rows
    
    // Check table headers
    expect(screen.getByText(/线索编号/i)).toBeInTheDocument();
    expect(screen.getByText(/客户信息/i)).toBeInTheDocument();
    expect(screen.getByText(/客户等级/i)).toBeInTheDocument();
    expect(screen.getByText(/状态/i)).toBeInTheDocument();
    expect(screen.getByText(/预约时间/i)).toBeInTheDocument();
    expect(screen.getByText(/业务标签/i)).toBeInTheDocument();
    expect(screen.getByText(/归属人员/i)).toBeInTheDocument();
    expect(screen.getByText(/操作/i)).toBeInTheDocument();
    
    // Check lead data
    expect(screen.getByText('LD-2024-0001')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('北京市朝阳区')).toBeInTheDocument();
    expect(screen.getByText('LD-2024-0002')).toBeInTheDocument();
    // Use getAllByText for '李四' since it appears multiple times (once as customer name, once as owner)
    const liSiElements = screen.getAllByText('李四');
    expect(liSiElements.length).toBeGreaterThan(0);
    expect(screen.getByText('上海市浦东新区')).toBeInTheDocument();
  });

  // Loading state test
  it('should display loading state when isLoading is true', () => {
    const { container } = render(<LeadTable {...mockProps} isLoading={true} />);
    
    // Check loading indicator
    const loadingIndicator = container.querySelector('.animate-spin');
    expect(loadingIndicator).toBeInTheDocument();
    expect(loadingIndicator).toHaveClass('rounded-full');
  });

  // Pagination test
  it('should handle pagination correctly', () => {
    render(<LeadTable {...mockProps} />);
    
    // Check items per page selection
    const itemsPerPageSelect = screen.getByRole('combobox');
    fireEvent.change(itemsPerPageSelect, { target: { value: '20' } });
    
    // Verify callbacks were called
    expect(mockProps.onItemsPerPageChange).toHaveBeenCalledWith(20);
    expect(mockProps.onPageChange).toHaveBeenCalledWith(1);
  });

  // Toolbar actions test
  it('should call onToolbarAction when toolbar buttons are clicked', () => {
    render(<LeadTable {...mockProps} />);
    
    // Test create button
    const createButton = screen.getByText(/新建线索/i);
    fireEvent.click(createButton);
    expect(mockProps.onToolbarAction).toHaveBeenCalledWith('create');
    
    // Test import button
    const importButton = screen.getByText(/导入/i);
    fireEvent.click(importButton);
    expect(mockProps.onToolbarAction).toHaveBeenCalledWith('import');
    
    // Test dedupe button
    const dedupeButton = screen.getByText(/去重\/合并/i);
    fireEvent.click(dedupeButton);
    expect(mockProps.onToolbarAction).toHaveBeenCalledWith('dedupe');
    
    // Test batch assign button (should be visible for sales_manager)
    const batchAssignButton = screen.getByText(/批量分配/i);
    fireEvent.click(batchAssignButton);
    expect(mockProps.onToolbarAction).toHaveBeenCalledWith('batch_assign');
  });

  // Permission control test
  it('should hide batch assign button for non-manager roles', () => {
    render(<LeadTable {...mockProps} currentUserRole='salesperson' />);
    
    // Batch assign button should not be visible for salesperson role
    expect(screen.queryByText(/批量分配/i)).not.toBeInTheDocument();
  });

  // Export menu test
  it('should display export options when export button is clicked', () => {
    render(<LeadTable {...mockProps} />);
    
    // Click export button
    const exportButton = screen.getByText(/导出当前页/i);
    fireEvent.click(exportButton);
    
    // Check export options
    expect(screen.getByText(/CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF/i)).toBeInTheDocument();
    
    // Click an export option
    fireEvent.click(screen.getByText(/CSV/i));
    expect(mockProps.onToolbarAction).toHaveBeenCalledWith('export_csv');
  });

  // Row actions test
  it('should call onAction when row actions are performed', () => {
    render(<LeadTable {...mockProps} />);
    
    // Test copy link button
    const copyLinkButtons = screen.getAllByText(/复制详情链接/i);
    if (copyLinkButtons[0]) {
      fireEvent.click(copyLinkButtons[0]);
    }
    
    // Verify callback was called
    expect(mockProps.onAction).toHaveBeenCalledWith('copyLink', mockLeads[0]);
  });

  // Appointment highlight test
  it('should highlight rows with appointment reminders', () => {
    render(<LeadTable {...mockProps} />);
    
    // Get table rows
    const rows = screen.getAllByRole('row');
    
    // Check if first row has highlight class for 24h reminder
    expect(rows[1]).toHaveClass('bg-red-50');
    
    // Check if second row has highlight class for 48h reminder
    expect(rows[2]).toHaveClass('bg-orange-50');
  });

  // Empty state test
  it('should handle empty leads list', () => {
    render(<LeadTable {...mockProps} leads={[]} totalItems={0} />);
    
    // Check that table body is empty but structure is still present
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1); // Only header row
  });

  // Pagination buttons test
  it('should call onPageChange when pagination buttons are clicked', () => {
    const paginationProps = {
      ...mockProps,
      totalPages: 3,
      currentPage: 2,
    };
    
    render(<LeadTable {...paginationProps} />);
    
    // Find and click next page button
    const nextPageButton = screen.getByRole('button', { name: /下一页/i });
    fireEvent.click(nextPageButton);
    
    // Verify callback was called
    expect(paginationProps.onPageChange).toHaveBeenCalledWith(3);
    
    // Find and click previous page button
    const prevPageButton = screen.getByRole('button', { name: /上一页/i });
    fireEvent.click(prevPageButton);
    
    // Verify callback was called
    expect(paginationProps.onPageChange).toHaveBeenCalledWith(1);
  });
});
