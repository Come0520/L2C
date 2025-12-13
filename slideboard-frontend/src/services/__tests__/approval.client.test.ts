import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approvalClientService } from '../approval.client';

// 模拟 fetch API
global.fetch = vi.fn();

// 测试数据
const mockApprovalRequest = {
  id: 'approval-1',
  type: 'quote',
  resourceId: 'quote-1',
  title: '报价审批',
  status: 'pending',
  createdAt: '2023-01-01T00:00:00Z'
};

const mockInboxItems = [
  {
    id: 'approval-1',
    type: 'quote',
    resourceId: 'quote-1',
    title: '报价审批',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'approval-2',
    type: 'order',
    resourceId: 'order-1',
    title: '订单审批',
    status: 'pending',
    createdAt: '2023-01-02T00:00:00Z'
  }
];

const mockApprovalFlows = [
  {
    id: 'flow-1',
    name: '报价审批流程',
    type: 'quote',
    steps: 2
  },
  {
    id: 'flow-2',
    name: '订单审批流程',
    type: 'order',
    steps: 3
  }
];

describe('Approval Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should create approval request successfully', async () => {
      // Arrange
      const params = {
        type: 'quote',
        resourceId: 'quote-1',
        title: '报价审批',
        data: { amount: 1000 }
      };

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApprovalRequest)
      });

      // Act
      const result = await approvalClientService.createRequest(params);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      expect(result).toEqual(mockApprovalRequest);
    });

    it('should handle creation failure', async () => {
      // Arrange
      const params = {
        type: 'quote',
        resourceId: 'quote-1',
        title: '报价审批',
        data: { amount: 1000 }
      };

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false
      });

      // Act & Assert
      await expect(approvalClientService.createRequest(params)).rejects.toThrow('Failed to create request');
    });
  });

  describe('getInbox', () => {
    it('should fetch inbox items successfully', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockInboxItems)
      });

      // Act
      const result = await approvalClientService.getInbox();

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/inbox');
      expect(result).toEqual(mockInboxItems);
    });

    it('should handle fetch failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false
      });

      // Act & Assert
      await expect(approvalClientService.getInbox()).rejects.toThrow('Failed to fetch inbox');
    });
  });

  describe('action', () => {
    it('should approve request successfully', async () => {
      // Arrange
      const mockActionResult = { success: true, status: 'approved' };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockActionResult)
      });

      // Act
      const result = await approvalClientService.action('approval-1', 'approve', '批准该请求');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/approval-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', comment: '批准该请求' })
      });
      expect(result).toEqual(mockActionResult);
    });

    it('should reject request successfully', async () => {
      // Arrange
      const mockActionResult = { success: true, status: 'rejected' };
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockActionResult)
      });

      // Act
      const result = await approvalClientService.action('approval-1', 'reject');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/approval-1/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', comment: undefined })
      });
      expect(result).toEqual(mockActionResult);
    });

    it('should handle action failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false
      });

      // Act & Assert
      await expect(approvalClientService.action('approval-1', 'approve')).rejects.toThrow('Failed to perform action');
    });
  });

  describe('getFlows', () => {
    it('should fetch approval flows successfully', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockApprovalFlows)
      });

      // Act
      const result = await approvalClientService.getFlows();

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/approvals/flows');
      expect(result).toEqual(mockApprovalFlows);
    });

    it('should handle fetch failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false
      });

      // Act & Assert
      await expect(approvalClientService.getFlows()).rejects.toThrow('Failed to fetch flows');
    });
  });
});
