import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMeasurementTasks, getMeasurementTaskById } from '../measurement.server';

// Mock the supabase server client
vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })
    })
  };
});

describe('measurement.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMeasurementTasks', () => {
    it('should retrieve all measurement tasks successfully', async () => {
      // Act
      const result = await getMeasurementTasks();
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getMeasurementTaskById', () => {
    it('should retrieve a single measurement task by id successfully', async () => {
      // Act
      const result = await getMeasurementTaskById('task-123');
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should return null for non-existent measurement task id', async () => {
      // Act
      const result = await getMeasurementTaskById('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
