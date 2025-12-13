import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { toast } from 'sonner';
import { vi } from 'vitest';

import { leadService } from '@/services/leads.client';

import { LeadTagsInput } from '../LeadTagsInput';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/leads.client', () => ({
  leadService: {
    getAvailableLeadTags: vi.fn(),
    getLeadTags: vi.fn(),
    assignTagsToLead: vi.fn(),
    removeTagFromLead: vi.fn(),
  }
}));

describe('LeadTagsInput', () => {
  const mockLeadId = 'test-lead-id';
  const mockCurrentUserId = 'test-user-id';
  const mockOnTagsChanged = vi.fn();

  const mockAvailableTags = [
    {
      id: 'tag-1',
      name: '已报价',
      tag_category: 'business',
      color: '#4F46E5',
      is_system: true,
      is_auto: false
    },
    {
      id: 'tag-2',
      name: '已到店',
      tag_category: 'business',
      color: '#10B981',
      is_system: true,
      is_auto: false
    },
  ];

  const mockAssignedTags = [
    {
      id: 'tag-1',
      name: '已报价',
      tag_category: 'business',
      color: '#4F46E5',
      is_system: true,
      is_auto: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (leadService.getAvailableLeadTags as any).mockResolvedValue(mockAvailableTags);
    (leadService.getLeadTags as any).mockResolvedValue(mockAssignedTags);
    (leadService.assignTagsToLead as any).mockResolvedValue(undefined);
    (leadService.removeTagFromLead as any).mockResolvedValue(true);
  });

  it('should render loading state initially', () => {
    render(
      <LeadTagsInput
        leadId={mockLeadId}
        currentUserId={mockCurrentUserId}
        onTagsChanged={mockOnTagsChanged}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  it('should render available tags and assigned tags after loading', async () => {
    await act(async () => {
      render(
        <LeadTagsInput
          leadId={mockLeadId}
          currentUserId={mockCurrentUserId}
          onTagsChanged={mockOnTagsChanged}
        />
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if assigned tag is rendered
    expect(screen.getByText('已报价')).toBeInTheDocument();

    // Check if available tags are rendered in the selector
    expect(screen.getByText('已到店')).toBeInTheDocument();
  });

  it('should handle tag assignment', async () => {
    (leadService.getAvailableLeadTags as any).mockResolvedValue(mockAvailableTags);
    (leadService.getLeadTags as any).mockResolvedValue(mockAssignedTags);
    (leadService.assignTagsToLead as any).mockResolvedValue(undefined);

    render(
      <LeadTagsInput
        leadId={mockLeadId}
        currentUserId={mockCurrentUserId}
        onTagsChanged={mockOnTagsChanged}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Select a tag directly from available list
    fireEvent.click(screen.getByText('已到店'));

    // Check if tag was assigned
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('已添加标签: 已到店');
      expect(mockOnTagsChanged).toHaveBeenCalled();
    });
  });

  it('should handle tag removal', async () => {
    (leadService.getAvailableLeadTags as any).mockResolvedValue(mockAvailableTags);
    (leadService.getLeadTags as any).mockResolvedValue(mockAssignedTags);
    (leadService.assignTagsToLead as any).mockResolvedValue(undefined);
    (leadService.removeTagFromLead as any).mockResolvedValue(true);

    render(
      <LeadTagsInput
        leadId={mockLeadId}
        currentUserId={mockCurrentUserId}
        onTagsChanged={mockOnTagsChanged}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if tag is rendered first
    await waitFor(() => {
      expect(screen.getByText('已报价')).toBeInTheDocument();
    });

    // Find and click the remove button
    const removeButton = screen.getByLabelText(/移除标签: 已报价/i);
    fireEvent.click(removeButton);

    // Check if tag was removed
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('已移除标签: 已报价');
      expect(mockOnTagsChanged).toHaveBeenCalled();
    });
  });

  it('should handle error when fetching tags', async () => {
    (leadService.getAvailableLeadTags as any).mockRejectedValue(new Error('Failed'));
    (leadService.getLeadTags as any).mockResolvedValue(mockAssignedTags);

    await act(async () => {
      render(
        <LeadTagsInput
          leadId={mockLeadId}
          currentUserId={mockCurrentUserId}
          onTagsChanged={mockOnTagsChanged}
        />
      );
    });

    // Check if error toast is shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('获取标签数据失败');
    });
  });
});
