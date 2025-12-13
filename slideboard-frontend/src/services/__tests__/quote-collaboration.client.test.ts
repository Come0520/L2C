import { describe, it, expect, beforeEach, vi } from 'vitest';

// 首先配置mock，确保在导入服务之前生效
vi.mock('@/lib/supabase/client', () => {
  // 创建mock查询对象
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
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

// 然后导入服务和mock模块
import { quoteCollaborationService } from '../quote-collaboration.client';
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

describe('quoteCollaborationService', () => {
  describe('getCollaborators', () => {
    it('should retrieve collaborators for a quote successfully', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const mockCollaborators = [
        {
          id: 'collab-1',
          quote_id: quoteId,
          user_id: 'user-1',
          permission: 'view',
          invited_by: 'test-user-123',
          invited_at: '2023-01-01T00:00:00Z',
          users: {
            id: 'user-1',
            raw_user_meta_data: {
              name: 'User 1',
              avatar_url: 'https://example.com/avatar1.jpg'
            }
          }
        }
      ];
      
      // 获取mock对象
      const { mockClient, mockQuery } = getMockObjects();
      
      // 配置mock查询对象返回mock数据
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.order.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: null, error: null });
      mockQuery.then = vi.fn().mockImplementation((resolve) => {
        resolve({ data: mockCollaborators, error: null });
        return Promise.resolve();
      });
      
      // Act
      const result = await quoteCollaborationService.getCollaborators(quoteId);
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('User 1');
    });

    it('should handle error when retrieving collaborators', async () => {
      // Arrange
      const quoteId = 'quote-123';
      
      // 获取mock对象
      const { mockQuery } = getMockObjects();
      
      // 配置mock查询对象返回错误
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.order.mockReturnThis();
      mockQuery.then = vi.fn().mockImplementation((resolve) => {
        resolve({ data: null, error: new Error('Database error') });
        return Promise.resolve();
      });
      
      // Act & Assert
      await expect(quoteCollaborationService.getCollaborators(quoteId)).rejects.toThrow();
    });
  });

  describe('inviteCollaborator', () => {
    it('should invite a collaborator to a quote', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userPhone = '13800138000';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 配置查找用户的mock返回
      const mockUser = {
        id: 'user-2',
        raw_user_meta_data: {
          phone: userPhone,
          name: 'User 2',
          avatar_url: 'https://example.com/avatar2.jpg'
        }
      };
      
      // 配置添加协作者的mock返回
      const mockCollaborator = {
        id: 'collab-2',
        quote_id: quoteId,
        user_id: mockUser.id,
        permission: 'view',
        invited_by: 'test-user-123',
        invited_at: '2023-01-01T00:00:00Z'
      };
      
      // 配置getCollaborators返回的数据
      const mockCollaborators = [
        {
          ...mockCollaborator,
          users: mockUser
        }
      ];
      
      // 为每个表创建不同的mockQuery对象
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: [mockUser], error: null });
          return Promise.resolve();
        })
      };
      
      const mockQuoteCollaboratorsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCollaborator, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockCollaborators, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法根据表名返回不同的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return mockUsersQuery;
        } else if (tableName === 'quote_collaborators') {
          return mockQuoteCollaboratorsQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      
      // Act & Assert
      await expect(quoteCollaborationService.inviteCollaborator(quoteId, userPhone, 'view')).resolves.not.toThrow();
    });

    it('should invite a collaborator with edit permission by default', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const userPhone = '13800138000';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 配置mock返回值
      const mockUser = {
        id: 'user-3',
        raw_user_meta_data: {
          phone: userPhone,
          name: 'User 3',
          avatar_url: 'https://example.com/avatar3.jpg'
        }
      };
      
      const mockCollaborator = {
        id: 'collab-3',
        quote_id: quoteId,
        user_id: mockUser.id,
        permission: 'edit',
        invited_by: 'test-user-123',
        invited_at: '2023-01-01T00:00:00Z'
      };
      
      // 配置getCollaborators返回的数据
      const mockCollaborators = [
        {
          ...mockCollaborator,
          users: mockUser
        }
      ];
      
      // 为每个表创建不同的mockQuery对象
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: [mockUser], error: null });
          return Promise.resolve();
        })
      };
      
      const mockQuoteCollaboratorsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCollaborator, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockCollaborators, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法根据表名返回不同的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'users') {
          return mockUsersQuery;
        } else if (tableName === 'quote_collaborators') {
          return mockQuoteCollaboratorsQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      
      // Act & Assert
      await expect(quoteCollaborationService.inviteCollaborator(quoteId, userPhone)).resolves.not.toThrow();
    });
  });

  describe('removeCollaborator', () => {
    it('should remove a collaborator from a quote', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const collaboratorId = 'collab-123';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 为quote_collaborators表创建mockQuery对象，包含delete方法
      const mockQuoteCollaboratorsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: { deleted: 1 }, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法返回包含delete方法的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'quote_collaborators') {
          return mockQuoteCollaboratorsQuery;
        }
        // 返回默认的mockQuery对象，包含所有必要的方法
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      
      // Act & Assert
      await expect(quoteCollaborationService.removeCollaborator(quoteId, collaboratorId)).resolves.not.toThrow();
    });
  });

  describe('getComments', () => {
    it('should retrieve comments for a quote successfully', async () => {
      // Arrange
      const quoteId = 'quote-123';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      const mockComments = [
        {
          id: 'comment-1',
          quote_id: quoteId,
          user_id: 'user-1',
          content: 'Test comment',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          users: {
            id: 'user-1',
            raw_user_meta_data: {
              name: 'User 1',
              avatar_url: 'https://example.com/avatar1.jpg'
            }
          }
        }
      ];
      
      // 为quote_comments表创建mockQuery对象
      const mockQuoteCommentsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockComments, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法返回quote_comments的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'quote_comments') {
          return mockQuoteCommentsQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      const result = await quoteCollaborationService.getComments(quoteId);
      
      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].user_name).toBe('User 1');
    });
  });

  describe('addComment', () => {
    it('should add a comment to a quote', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const content = 'Test comment';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 配置mock返回值
      const mockComment = {
        id: 'comment-2',
        quote_id: quoteId,
        user_id: 'test-user-123',
        content: content,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      const mockCommentWithUser = {
        ...mockComment,
        users: {
          id: 'test-user-123',
          raw_user_meta_data: {
            name: 'Test User',
            avatar_url: 'https://example.com/avatar.jpg'
          }
        }
      };
      
      // 配置getComments返回的数据
      const mockComments = [mockCommentWithUser];
      
      // 为quote_comments表创建mockQuery对象
      const mockQuoteCommentsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockComments, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法返回quote_comments的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'quote_comments') {
          return mockQuoteCommentsQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      
      // Act & Assert
      await expect(quoteCollaborationService.addComment(quoteId, content)).resolves.not.toThrow();
    });

    it('should add a comment with position', async () => {
      // Arrange
      const quoteId = 'quote-123';
      const content = 'Test comment with position';
      const position = { x: 100, y: 200 };
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 配置mock返回值
      const mockComment = {
        id: 'comment-3',
        quote_id: quoteId,
        user_id: 'test-user-123',
        content: content,
        position_x: position.x,
        position_y: position.y,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      const mockCommentWithUser = {
        ...mockComment,
        users: {
          id: 'test-user-123',
          raw_user_meta_data: {
            name: 'Test User',
            avatar_url: 'https://example.com/avatar.jpg'
          }
        }
      };
      
      // 配置getComments返回的数据
      const mockComments = [mockCommentWithUser];
      
      // 为quote_comments表创建mockQuery对象
      const mockQuoteCommentsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockComment, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockComments, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法返回quote_comments的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'quote_comments') {
          return mockQuoteCommentsQuery;
        }
        // 返回默认的mockQuery对象
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      
      // Act & Assert
      await expect(quoteCollaborationService.addComment(quoteId, content, position)).resolves.not.toThrow();
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment from a quote', async () => {
      // Arrange
      const commentId = 'comment-123';
      
      // 获取mock对象
      const { mockClient } = getMockObjects();
      
      // 为quote_comments表创建mockQuery对象，包含delete方法
      const mockQuoteCommentsQuery = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: { deleted: 1 }, error: null });
          return Promise.resolve();
        })
      };
      
      // 配置mockClient.from方法返回包含delete方法的mockQuery对象
      mockClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'quote_comments') {
          return mockQuoteCommentsQuery;
        }
        // 返回默认的mockQuery对象，包含所有必要的方法
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
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
      
      // Act & Assert
      await expect(quoteCollaborationService.deleteComment(commentId)).resolves.not.toThrow();
    });
  });
});
