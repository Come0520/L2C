import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usersService } from '../users.client';

// 首先配置mock，确保在导入服务之前生效
vi.mock('@/lib/supabase/client', () => {
  // 创建mock查询对象，用于动态配置返回值
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    // 添加then方法以支持Promise链式调用
    then: vi.fn().mockImplementation((resolve) => {
      resolve({ data: null, error: null });
      return Promise.resolve();
    })
  };

  // 创建mock supabase客户端
  const mockClient = {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null,
      }),
    },
  };

  return {
    createClient: vi.fn(() => mockClient),
    // 暴露mock对象以便在测试中配置
    __esModule: true,
    // 额外导出mock对象，以便在测试中修改
    __mockClient: mockClient,
    __mockQuery: mockQuery,
  };
});

// 然后导入mock模块
import * as supabaseModule from '@/lib/supabase/client';

// 创建一个辅助函数，用于获取mock对象
const getMockObjects = () => {
  // 从mock模块中获取mock对象
  const mockClient = (supabaseModule as any).__mockClient;
  const mockQuery = (supabaseModule as any).__mockQuery;
  return { mockClient, mockQuery };
};

// 在每个测试套件开始前重置mock
beforeEach(() => {
  vi.clearAllMocks();
});

describe('usersService', () => {
  describe('getUsers', () => {
    it('should retrieve all users successfully', async () => {
      // Arrange
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          phone: '13800138001',
          raw_user_meta_data: {
            name: 'User 1',
            phone: '13800138001'
          }
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          phone: '13800138002',
          raw_user_meta_data: {
            name: 'User 2',
            phone: '13800138002'
          }
        }
      ];
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 为users表创建mockQuery对象
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockUsers, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法返回users表的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return mockUsersQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ data: null, error: null });
            return Promise.resolve();
          })
        };
      });
      
      // Act
      const result = await usersService.getUsers();
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('getUserById', () => {
    it('should retrieve a single user by id successfully', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'user1@example.com',
        phone: '13800138001',
        raw_user_meta_data: {
          name: 'User 1',
          phone: '13800138001'
        }
      };
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 为users表创建mockQuery对象
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null })
      };
      
      // 配置mockClient.from方法返回users表的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return mockUsersQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ data: null, error: null });
            return Promise.resolve();
          })
        };
      });
      
      // Act
      const result = await usersService.getUserById(userId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
    });

    it('should return null for non-existent user id', async () => {
      // Arrange
      const nonExistentUserId = 'non-existent-user-id';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 为users表创建mockQuery对象，返回null
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      };
      
      // 配置mockClient.from方法返回users表的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return mockUsersQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ data: null, error: null });
            return Promise.resolve();
          })
        };
      });
      
      // Act
      const result = await usersService.getUserById(nonExistentUserId);
      
      // Assert
      expect(result).toBeNull();
    });
  });
});
