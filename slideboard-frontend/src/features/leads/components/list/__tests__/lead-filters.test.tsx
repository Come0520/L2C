import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as useLeadsFiltersHook from '@/features/leads/hooks/useLeadsFilters';

import { LeadFilters } from '../LeadFilters';

// Mock the hook
vi.mock('@/features/leads/hooks/useLeadsFilters');

describe('LeadFilters Component', () => {
  // Mock hook return values
  const mockUpdateFilters = vi.fn();
  const mockDebouncedUpdate = vi.fn();
  
  const defaultFilters = {
    searchTerm: '',
    status: '',
    tag: '',
    level: '',
    source: '',
    owner: '',
    dateStart: '',
    dateEnd: '',
    page: 1,
    pageSize: 20,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementation
    vi.mocked(useLeadsFiltersHook.useLeadsFilters).mockReturnValue({
      filters: defaultFilters,
      updateFilters: mockUpdateFilters,
      debouncedUpdate: mockDebouncedUpdate,
    });
  });

  // Component rendering test
  it('should render all filter fields correctly', () => {
    render(<LeadFilters />);
    
    // Check search input by placeholder
    expect(screen.getByPlaceholderText('姓名/需求')).toBeInTheDocument();
    
    // Test select fields by label text
    expect(screen.getByText(/状态/i)).toBeInTheDocument();
    expect(screen.getByText(/标签/i)).toBeInTheDocument();
    expect(screen.getByText(/客户等级/i)).toBeInTheDocument();
    
    // Check input fields by label text
    expect(screen.getByText(/来源渠道/i)).toBeInTheDocument();
    expect(screen.getByText(/归属/i)).toBeInTheDocument();
    
    // Check date fields by label text
    expect(screen.getByText(/开始日期/i)).toBeInTheDocument();
    expect(screen.getByText(/结束日期/i)).toBeInTheDocument();
  });

  // Initial values test
  it('should display initial values correctly', () => {
    const customFilters = {
      ...defaultFilters,
      searchTerm: 'test search',
      status: 'PENDING_ASSIGNMENT',
      tag: 'quoted',
      level: 'A',
      source: 'online',
      owner: 'test owner',
      dateStart: '2024-01-01',
      dateEnd: '2024-01-31',
    };
    
    vi.mocked(useLeadsFiltersHook.useLeadsFilters).mockReturnValue({
      filters: customFilters,
      updateFilters: mockUpdateFilters,
      debouncedUpdate: mockDebouncedUpdate,
    });
    
    render(<LeadFilters />);
    
    // Check search input value
    const searchInput = screen.getByPlaceholderText('姓名/需求');
    expect(searchInput).toHaveValue('test search');
    
    // Get all select elements and check their values
    // Note: implementation details might vary, finding by role is safer
    // We need to be careful with how Select components render in tests
    // Assuming standard selects or accessible components
    
    // For selects, we can check if the display value is correct or if the value prop is passed
    // Since we are mocking the hook that provides values, verifying the component received them 
    // and passed them to inputs is what we are doing here.
    
    // Check Selects by finding the trigger or input
    // This part depends heavily on PaperSelect implementation.
    // Assuming PaperSelect uses standard select under the hood or we can find by value
    
    // Simplify check: verify update functions are called when changed (in next test)
    // and verify inputs have values
    
    // Get all text input elements (excluding search)
    const textInputs = screen.getAllByRole('textbox');
    // search, source, owner, start, end (if dates act as text inputs or separate)
    // The exact count depends on implementation details of PaperSelect (if it has search input) and date pickers
    
    // Let's check by placeholder/label which is more robust
    expect(screen.getByPlaceholderText('门店/渠道/线上')).toHaveValue('online');
    expect(screen.getByPlaceholderText('门店/成员')).toHaveValue('test owner');
    
    // Date inputs
    const dateInputs = screen.getAllByLabelText(/日期/i); // Matches "开始日期" and "结束日期"
    // Note: getAllByLabelText might return the container or input depending on structure
    // Let's use selector for date inputs
    const dateInputElements = document.querySelectorAll('input[type="date"]');
    expect(dateInputElements[0]).toHaveValue('2024-01-01');
    expect(dateInputElements[1]).toHaveValue('2024-01-31');
  });

  // Test all filter inputs
  it('should call update handlers when inputs change', async () => {
    render(<LeadFilters />);
    
    // Test search input (debounced)
    const searchInput = screen.getByPlaceholderText('姓名/需求');
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    expect(mockDebouncedUpdate).toHaveBeenCalledWith({ searchTerm: 'new search' });
    
    // Test status select
    // Finding select by label/role might be tricky with custom components.
    // Assuming PaperSelect renders a select or we can find it.
    // If PaperSelect uses Radix UI or similar, we might need different interaction.
    // Fallback to finding by label text and getting the sibling select/input
    
    const statusSelect = screen.getByLabelText('状态');
    fireEvent.change(statusSelect, { target: { value: 'PENDING_FOLLOW_UP' } });
    expect(mockUpdateFilters).toHaveBeenCalledWith({ status: 'PENDING_FOLLOW_UP' });
    
    const tagSelect = screen.getByLabelText('标签');
    fireEvent.change(tagSelect, { target: { value: 'arrived' } });
    expect(mockUpdateFilters).toHaveBeenCalledWith({ tag: 'arrived' });
    
    const levelSelect = screen.getByLabelText('客户等级');
    fireEvent.change(levelSelect, { target: { value: 'B' } });
    expect(mockUpdateFilters).toHaveBeenCalledWith({ level: 'B' });
    
    // Test text inputs (debounced)
    const sourceInput = screen.getByPlaceholderText('门店/渠道/线上');
    fireEvent.change(sourceInput, { target: { value: 'store' } });
    expect(mockDebouncedUpdate).toHaveBeenCalledWith({ source: 'store' });
    
    const ownerInput = screen.getByPlaceholderText('门店/成员');
    fireEvent.change(ownerInput, { target: { value: 'new owner' } });
    expect(mockDebouncedUpdate).toHaveBeenCalledWith({ owner: 'new owner' });
    
    // Test date inputs (direct update)
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2024-02-01' } });
    expect(mockUpdateFilters).toHaveBeenCalledWith({ dateStart: '2024-02-01' });
    
    fireEvent.change(dateInputs[1], { target: { value: '2024-02-28' } });
    expect(mockUpdateFilters).toHaveBeenCalledWith({ dateEnd: '2024-02-28' });
  });
});
