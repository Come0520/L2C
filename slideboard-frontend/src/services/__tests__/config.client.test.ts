import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configService } from '../config.client';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

describe('ConfigService', () => {
  // 创建mock查询对象
  const createMockQuery = (data: any = null, error: any = null) => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: any) => onFulfilled({ data, error })),
      async: vi.fn().mockReturnThis()
    };
    return mockQuery;
  };

  // 创建mock supabase客户端
  const createMockSupabaseClient = (data: any = null, error: any = null) => ({
    from: vi.fn(() => createMockQuery(data, error)),
    rpc: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemConfigs', () => {
    it('should return all system configs when successful', async () => {
      // Arrange
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
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await configService.getSystemConfigs();

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_configs');
      expect(result).toEqual(mockData);
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('Database error');
      const mockSupabaseClient = createMockSupabaseClient(null, mockError);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act & Assert
      await expect(configService.getSystemConfigs()).rejects.toThrow('Database error');
    });
  });

  describe('updateSystemConfig', () => {
    it('should update system config when successful', async () => {
      // Arrange
      const mockData = { 
        id: '1', 
        key: 'APP_NAME', 
        value: 'Updated Slideboard', 
        description: 'Updated application name', 
        category: 'general',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-12-12T22:18:00Z'
      };
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      const updateData = { 
        value: 'Updated Slideboard', 
        description: 'Updated application name' 
      };

      // Act
      const result = await configService.updateSystemConfig('1', updateData);

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_configs');
      expect(result).toEqual(mockData);
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('Update failed');
      const mockSupabaseClient = createMockSupabaseClient(null, mockError);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act & Assert
      await expect(configService.updateSystemConfig('1', { value: 'New Value' })).rejects.toThrow('Update failed');
    });
  });

  describe('createSystemConfig', () => {
    it('should create system config when successful', async () => {
      // Arrange
      const mockData = { 
        id: '3', 
        key: 'NEW_CONFIG', 
        value: 'new-value', 
        description: 'A new configuration', 
        category: 'general',
        created_at: '2025-12-12T22:18:00Z',
        updated_at: '2025-12-12T22:18:00Z'
      };
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await configService.createSystemConfig('NEW_CONFIG', 'new-value', 'general', 'A new configuration');

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_configs');
      expect(result).toEqual(mockData);
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('Creation failed');
      const mockSupabaseClient = createMockSupabaseClient(null, mockError);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act & Assert
      await expect(configService.createSystemConfig('NEW_CONFIG', 'new-value', 'general')).rejects.toThrow('Creation failed');
    });
  });

  describe('getConfigByKey', () => {
    it('should return config value by key when found', async () => {
      // Arrange
      const mockData = { value: 'Slideboard' };
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await configService.getConfigByKey('APP_NAME');

      // Assert
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('system_configs');
      expect(result).toBe('Slideboard');
    });

    it('should return undefined when config not found', async () => {
      // Arrange
      const mockData = null;
      const mockSupabaseClient = createMockSupabaseClient(mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await configService.getConfigByKey('NON_EXISTENT_KEY');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockError = new Error('Fetch failed');
      const mockSupabaseClient = createMockSupabaseClient(null, mockError);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act & Assert
      await expect(configService.getConfigByKey('APP_NAME')).rejects.toThrow('Fetch failed');
    });
  });
});
