import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LeadFilters } from '../LeadFilters';

describe('LeadFilters Component', () => {
  // Mock props
  const mockProps = {
    searchTerm: '',
    setSearchTerm: vi.fn(),
    status: '',
    setStatus: vi.fn(),
    tag: '' as const,
    setTag: vi.fn(),
    level: '',
    setLevel: vi.fn(),
    source: '',
    setSource: vi.fn(),
    owner: '',
    setOwner: vi.fn(),
    designer: '',
    setDesigner: vi.fn(),
    shoppingGuide: '',
    setShoppingGuide: vi.fn(),
    dateStart: '',
    setDateStart: vi.fn(),
    dateEnd: '',
    setDateEnd: vi.fn(),
  };

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  // Component rendering test
  it('should render all filter fields correctly', () => {
    render(<LeadFilters {...mockProps} />);
    
    // Check search input by placeholder
    expect(screen.getByPlaceholderText('姓名/需求')).toBeInTheDocument();
    
    // Test select fields by label text
    expect(screen.getByText(/状态/i)).toBeInTheDocument();
    expect(screen.getByText(/标签/i)).toBeInTheDocument();
    expect(screen.getByText(/客户等级/i)).toBeInTheDocument();
    
    // Check input fields by label text
    expect(screen.getByText(/来源渠道/i)).toBeInTheDocument();
    expect(screen.getByText(/归属/i)).toBeInTheDocument();
    expect(screen.getByText(/设计师/i)).toBeInTheDocument();
    expect(screen.getByText(/导购/i)).toBeInTheDocument();
    
    // Check date fields by label text
    expect(screen.getByText(/开始日期/i)).toBeInTheDocument();
    expect(screen.getByText(/结束日期/i)).toBeInTheDocument();
  });

  // Initial values test
  it('should display initial values correctly', () => {
    const initialProps = {
      ...mockProps,
      searchTerm: 'test search',
      status: 'PENDING_ASSIGNMENT',
      tag: 'quoted' as const,
      level: 'A',
      source: 'online',
      owner: 'test owner',
      designer: 'test designer',
      shoppingGuide: 'test guide',
      dateStart: '2024-01-01',
      dateEnd: '2024-01-31',
    };
    
    render(<LeadFilters {...initialProps} />);
    
    // Check search input value
    const searchInput = screen.getByPlaceholderText('姓名/需求');
    expect(searchInput).toHaveValue('test search');
    
    // Get all select elements and check their values
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);
    expect(selects[0]).toHaveValue('PENDING_ASSIGNMENT'); // status
    expect(selects[1]).toHaveValue('quoted'); // tag
    expect(selects[2]).toHaveValue('A'); // level
    
    // Get all text input elements (excluding search)
    const textInputs = screen.getAllByRole('textbox');
    expect(textInputs).toHaveLength(5);
    expect(textInputs[1]).toHaveValue('online'); // source
    expect(textInputs[2]).toHaveValue('test owner'); // owner
    expect(textInputs[3]).toHaveValue('test designer'); // designer
    expect(textInputs[4]).toHaveValue('test guide'); // shopping guide
    
    // Get all inputs and filter for date inputs
    const allInputs = document.querySelectorAll('input');
    const dateInputs = Array.from(allInputs).filter(input => input.type === 'date');
    expect(dateInputs).toHaveLength(2);
    if (dateInputs[0]) expect(dateInputs[0]).toHaveValue('2024-01-01'); // start date
    if (dateInputs[1]) expect(dateInputs[1]).toHaveValue('2024-01-31'); // end date
  });

  // Test all filter inputs with a more direct approach
  it('should call all filter handlers when inputs change', async () => {
    render(<LeadFilters {...mockProps} />);
    
    // Test search input
    const searchInput = screen.getByPlaceholderText('姓名/需求');
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    
    // Test select fields
    const selects = screen.getAllByRole('combobox');
    if (selects[0]) fireEvent.change(selects[0], { target: { value: 'PENDING_FOLLOW_UP' } }); // status
    if (selects[1]) fireEvent.change(selects[1], { target: { value: 'arrived' } }); // tag
    if (selects[2]) fireEvent.change(selects[2], { target: { value: 'B' } }); // level
    
    // Test text inputs
    const textInputs = screen.getAllByRole('textbox');
    if (textInputs[1]) fireEvent.change(textInputs[1], { target: { value: 'store' } }); // source
    if (textInputs[2]) fireEvent.change(textInputs[2], { target: { value: 'new owner' } }); // owner
    if (textInputs[3]) fireEvent.change(textInputs[3], { target: { value: 'new designer' } }); // designer
    if (textInputs[4]) fireEvent.change(textInputs[4], { target: { value: 'new guide' } }); // shopping guide
    
    // Test date inputs
    const allInputs = document.querySelectorAll('input');
    const dateInputs = Array.from(allInputs).filter(input => input.type === 'date');
    if (dateInputs[0]) fireEvent.change(dateInputs[0], { target: { value: '2024-02-01' } }); // start date
    if (dateInputs[1]) fireEvent.change(dateInputs[1], { target: { value: '2024-02-28' } }); // end date
    
    // Wait for debounce to complete (300ms for search, 200ms for others)
    await waitFor(() => {
      // Check that all handlers were called
      expect(mockProps.setSearchTerm).toHaveBeenCalledWith('new search');
      if (selects[0]) expect(mockProps.setStatus).toHaveBeenCalledWith('PENDING_FOLLOW_UP');
      if (selects[1]) expect(mockProps.setTag).toHaveBeenCalledWith('arrived');
      if (selects[2]) expect(mockProps.setLevel).toHaveBeenCalledWith('B');
      if (textInputs[1]) expect(mockProps.setSource).toHaveBeenCalledWith('store');
      if (textInputs[2]) expect(mockProps.setOwner).toHaveBeenCalledWith('new owner');
      if (textInputs[3]) expect(mockProps.setDesigner).toHaveBeenCalledWith('new designer');
      if (textInputs[4]) expect(mockProps.setShoppingGuide).toHaveBeenCalledWith('new guide');
      if (dateInputs[0]) expect(mockProps.setDateStart).toHaveBeenCalledWith('2024-02-01');
      if (dateInputs[1]) expect(mockProps.setDateEnd).toHaveBeenCalledWith('2024-02-28');
    }, { timeout: 600 });
  });

  // Test with debounce functionality
  it('should use debounce for search input', async () => {
    render(<LeadFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('姓名/需求');
    
    // Type quickly to test debounce
    fireEvent.change(searchInput, { target: { value: 't' } });
    fireEvent.change(searchInput, { target: { value: 'te' } });
    fireEvent.change(searchInput, { target: { value: 'tes' } });
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Wait for debounce to complete (300ms + some buffer)
    await waitFor(() => {
      // Should only be called once with the final value
      expect(mockProps.setSearchTerm).toHaveBeenCalledTimes(1);
      expect(mockProps.setSearchTerm).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });
});
