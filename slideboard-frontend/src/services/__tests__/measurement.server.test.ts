import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getMeasurementTasks, getMeasurementTaskById } from '../measurement.server';

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

describe('measurement.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.select.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.eq.mockReturnThis();
  });

  describe('getMeasurementTasks', () => {
    it('should retrieve all measurement tasks successfully', async () => {
      const mockData = [{
        id: '1',
        order_id: 'o1',
        status: 'pending',
        customer_name: 'C1',
        project_address: 'Addr1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }];

      mockQuery.order.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await getMeasurementTasks();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getMeasurementTaskById', () => {
    it('should retrieve a single measurement task by id successfully', async () => {
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
      
      const result = await getMeasurementTaskById('task-123');
      
      expect(result).toBeDefined();
      expect(result?.id).toBe('task-123');
    });

    it('should return null for non-existent measurement task id', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Row not found' }
      });
      
      const result = await getMeasurementTaskById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });
});
