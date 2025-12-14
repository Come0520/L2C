import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ApiError } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/client';

import { assignmentService } from '../assignment.client';

// 模拟依赖
vi.mock('@/lib/supabase/client');

// 模拟 fetch API
global.fetch = vi.fn();

const mockCreateClient = createClient as vi.Mock;
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  }
};

describe('Assignment Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
    
    // 设置默认模拟
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('reassignLead', () => {
    it('should reassign lead successfully with reason', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' }
        },
        error: null
      });
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true
      });

      // Act
      await assignmentService.reassignLead('lead-1', 'user-2', '重新分配原因');

      // Assert
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/assignment/reassign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'lead',
          resourceId: 'lead-1',
          assigneeId: 'user-2',
          reason: '重新分配原因'
        })
      });
    });

    it('should reassign lead successfully without reason', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' }
        },
        error: null
      });
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true
      });

      // Act
      await assignmentService.reassignLead('lead-1', 'user-2');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/assignment/reassign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'lead',
          resourceId: 'lead-1',
          assigneeId: 'user-2',
          reason: undefined
        })
      });
    });

    it('should throw error when user not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: null
        },
        error: null
      });

      // Act & Assert
      await expect(assignmentService.reassignLead('lead-1', 'user-2')).rejects.toThrow(ApiError);
      await expect(assignmentService.reassignLead('lead-1', 'user-2')).rejects.toThrow('User not authenticated');
    });

    it('should throw error when reassign fails', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' }
        },
        error: null
      });
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue('Reassign failed')
      });

      // Act & Assert
      await expect(assignmentService.reassignLead('lead-1', 'user-2')).rejects.toThrow(ApiError);
      await expect(assignmentService.reassignLead('lead-1', 'user-2')).rejects.toThrow('Reassign failed');
    });
  });

  describe('reassignOrder', () => {
    it('should reassign order successfully with reason', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' }
        },
        error: null
      });
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true
      });

      // Act
      await assignmentService.reassignOrder('order-1', 'user-2', '重新分配原因');

      // Assert
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/assignment/reassign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'order',
          resourceId: 'order-1',
          assigneeId: 'user-2',
          reason: '重新分配原因'
        })
      });
    });

    it('should reassign order successfully without reason', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' }
        },
        error: null
      });
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true
      });

      // Act
      await assignmentService.reassignOrder('order-1', 'user-2');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/assignment/reassign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resourceType: 'order',
          resourceId: 'order-1',
          assigneeId: 'user-2',
          reason: undefined
        })
      });
    });

    it('should throw error when user not authenticated', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: null
        },
        error: null
      });

      // Act & Assert
      await expect(assignmentService.reassignOrder('order-1', 'user-2')).rejects.toThrow(ApiError);
      await expect(assignmentService.reassignOrder('order-1', 'user-2')).rejects.toThrow('User not authenticated');
    });

    it('should throw error when reassign fails', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'test@example.com' }
        },
        error: null
      });
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue('Reassign failed')
      });

      // Act & Assert
      await expect(assignmentService.reassignOrder('order-1', 'user-2')).rejects.toThrow(ApiError);
      await expect(assignmentService.reassignOrder('order-1', 'user-2')).rejects.toThrow('Reassign failed');
    });
  });
});
