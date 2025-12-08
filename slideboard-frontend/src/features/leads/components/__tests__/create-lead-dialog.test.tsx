import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi } from 'vitest';
import type { Mock } from 'vitest';

import { toast } from '@/components/ui/toast';

import CreateLeadDialog from '../create-lead-dialog';

// Mock dependencies
vi.mock('@/components/ui/toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/services/leads.client', () => ({
  leadService: {
    createLead: vi.fn(),
  },
}));

describe('CreateLeadDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog when isOpen is true', () => {
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    expect(screen.getByText('新建线索')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入客户姓名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入联系电话')).toBeInTheDocument();
  });

  it('should not render the dialog when isOpen is false', () => {
    const { container } = render(
      <CreateLeadDialog 
        isOpen={false} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should close the dialog when close button is clicked', () => {
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    fireEvent.click(screen.getByText('✕'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close the dialog when cancel button is clicked', () => {
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    fireEvent.click(screen.getByText('取消'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show error message when required fields are empty', async () => {
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('请填写客户姓名和电话');
    });
  });

  it('should call createLead function with valid data when form is submitted', async () => {
    const { leadService } = await import('@/services/leads.client');
    (leadService.createLead as Mock).mockResolvedValueOnce({ id: 'test-lead-id' });
    
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    // Fill in form data
    fireEvent.change(screen.getByPlaceholderText('请输入客户姓名'), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByPlaceholderText('请输入联系电话'), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByPlaceholderText('请输入项目地址'), { target: { value: '测试地址' } });
    fireEvent.change(screen.getByPlaceholderText('请输入客户需求...'), { target: { value: '测试需求' } });
    
    // Submit form
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(leadService.createLead).toHaveBeenCalledWith(expect.objectContaining({
        customerName: '测试客户',
        phone: '13800138000',
        projectAddress: '测试地址',
        requirements: ['测试需求'],
        source: 'Manual Entry'
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error message when createLead fails', async () => {
    const { leadService } = await import('@/services/leads.client');
    (leadService.createLead as Mock).mockRejectedValueOnce(new Error('创建失败'));
    
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    // Fill in form data
    fireEvent.change(screen.getByPlaceholderText('请输入客户姓名'), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByPlaceholderText('请输入联系电话'), { target: { value: '13800138000' } });
    
    // Submit form
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('创建失败，请重试');
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should reset form after successful submission', async () => {
    const { leadService } = await import('@/services/leads.client');
    (leadService.createLead as Mock).mockResolvedValueOnce({ id: 'test-lead-id' });
    
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    // Fill in form data
    fireEvent.change(screen.getByPlaceholderText('请输入客户姓名'), { target: { value: '测试客户' } });
    fireEvent.change(screen.getByPlaceholderText('请输入联系电话'), { target: { value: '13800138000' } });
    
    // Submit form
    fireEvent.click(screen.getByText('保存'));
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
    
    // Clean up previous renders
    cleanup();
    
    // Re-open dialog and check if form is reset
    render(
      <CreateLeadDialog 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    expect(screen.getByPlaceholderText('请输入客户姓名')).toHaveValue('');
    expect(screen.getByPlaceholderText('请输入联系电话')).toHaveValue('');
  });
});
