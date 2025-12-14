import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getInstallationTasks, getInstallationTaskById } from '../installation.server';

const { mockQuery } = vi.hoisted(() => {
  return {
    mockQuery: {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }
  }
})

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue(mockQuery)
    })
  };
});

describe('installation.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.select.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.eq.mockReturnThis();
  });

  describe('getInstallationTasks', () => {
    it('should retrieve all installation tasks successfully', async () => {
      const mockData = [{ 
        id: '1', 
        order_id: 'o1', 
        status: 'pending', 
        customer_name: 'C1', 
        project_address: 'Addr1', 
        created_at: '2024-01-01', 
        updated_at: '2024-01-01' 
      }];
      
      // Since chain is from().select().order(), order() must resolve to data
      mockQuery.order.mockResolvedValue({
         data: mockData,
         error: null
      });

      // Also support case where order() isn't called if implementation changes, 
      // but current implementation calls order().
      
      const result = await getInstallationTasks();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getInstallationTaskById', () => {
    it('should retrieve a single installation task by id successfully', async () => {
      mockQuery.single.mockResolvedValue({
        data: { 
          id: 'task-123', 
          order_id: 'o1', 
          status: 'pending', 
          customer_name: 'C1', 
          project_address: 'Addr1', 
          created_at: '2024-01-01', 
          updated_at: '2024-01-01' 
        },
        error: null
      });
      
      const result = await getInstallationTaskById('task-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('task-123');
    });

    it('should return null for non-existent installation task id', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' }
      });
      
      const result = await getInstallationTaskById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });
});
