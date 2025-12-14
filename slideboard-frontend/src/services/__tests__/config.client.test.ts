import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockSupabase, mockQuery } = vi.hoisted(() => {
  const mockQuery: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    then: vi.fn((resolve) => resolve({ data: [], error: null }))
  };
  
  const mockSupabase = {
    from: vi.fn(() => mockQuery),
    rpc: vi.fn()
  };
  
  return { mockSupabase, mockQuery };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

import { createClient } from '@/lib/supabase/client';

import { configService } from '../config.client';

describe('ConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.select.mockReturnThis();
    mockQuery.insert.mockReturnThis();
    mockQuery.update.mockReturnThis();
    mockQuery.delete.mockReturnThis();
    mockQuery.eq.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.then.mockImplementation((resolve: any) => resolve({ data: [], error: null }));
  });

  describe('getSystemConfigs', () => {
    it('should return all system configs when successful', async () => {
      const mockData = [
        { 
          id: '1', 
          key: 'APP_NAME', 
          value: 'Slideboard', 
          description: 'Application name', 
          category: 'general',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        { 
          id: '2', 
          key: 'API_URL', 
          value: 'https://api.example.com', 
          description: 'API endpoint', 
          category: 'api',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ];
      
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: mockData, error: null }));

      const result = await configService.getSystemConfigs();

      expect(mockSupabase.from).toHaveBeenCalledWith('system_configs');
      expect(result).toEqual(mockData);
    });

    it('should throw error when API call fails', async () => {
      const mockError = { message: 'Database error' };
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: null, error: mockError }));

      await expect(configService.getSystemConfigs()).rejects.toThrow('Database error');
    });
  });

  describe('updateSystemConfig', () => {
    it('should update system config when successful', async () => {
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: null, error: null }));

      const updateData = { 
        value: 'Updated Slideboard', 
        description: 'Updated application name' 
      };

      await configService.updateSystemConfig('1', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('system_configs');
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should throw error when API call fails', async () => {
      const mockError = { message: 'Update failed' };
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: null, error: mockError }));

      const updateData = { value: 'Updated Slideboard' };

      await expect(configService.updateSystemConfig('1', updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('createSystemConfig', () => {
    it('should create system config when successful', async () => {
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: null, error: null }));

      await configService.createSystemConfig('NEW_KEY', 'New Value', 'general', 'New Config');

      expect(mockSupabase.from).toHaveBeenCalledWith('system_configs');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        key: 'NEW_KEY',
        value: 'New Value',
        category: 'general',
        description: 'New Config'
      });
    });

    it('should throw error when API call fails', async () => {
      const mockError = { message: 'Creation failed' };
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: null, error: mockError }));

      await expect(configService.createSystemConfig('NEW_KEY', 'Val', 'cat')).rejects.toThrow('Creation failed');
    });
  });
});
