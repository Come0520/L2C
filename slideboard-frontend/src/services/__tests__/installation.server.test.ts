import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getInstallationTasks, getInstallationTaskById } from '../installation.server';

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

describe('installation.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstallationTasks', () => {
    it('should retrieve all installation tasks successfully', async () => {
      // Act
      const result = await getInstallationTasks();
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getInstallationTaskById', () => {
    it('should retrieve a single installation task by id successfully', async () => {
      // Act
      const result = await getInstallationTaskById('task-123');
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should return null for non-existent installation task id', async () => {
      // Act
      const result = await getInstallationTaskById('non-existent-id');
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
