import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { LogsClient, logsService, logMeasurementOperation } from '../logs.client';

// 模拟依赖
vi.mock('@/lib/supabase/client');

// 模拟 fetch API
global.fetch = vi.fn();

const mockCreateClient = createClient as vi.Mock;

// 测试数据
const mockLog = {
  id: 'log-1',
  userId: 'user-1',
  userName: '测试用户',
  action: 'CREATE',
  level: 'INFO',
  resourceId: 'resource-1',
  resourceType: 'quote',
  details: { message: '测试操作' },
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: '2023-01-01T00:00:00Z'
};

const mockLogs = [
  mockLog,
  {
    id: 'log-2',
    userId: 'user-2',
    userName: '测试用户2',
    action: 'UPDATE',
    level: 'WARNING',
    resourceId: 'resource-2',
    resourceType: 'order',
    details: { message: '测试更新操作' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: '2023-01-02T00:00:00Z'
  }
];

describe('Logs Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  describe('LogsClient class', () => {
    let logsClient: LogsClient;

    beforeEach(() => {
      logsClient = new LogsClient();
    });

    describe('createLog', () => {
      it('should create log successfully', async () => {
        // Arrange
        const logData = {
          userId: 'user-1',
          userName: '测试用户',
          action: 'CREATE',
          level: 'INFO',
          resourceId: 'resource-1',
          resourceType: 'quote',
          details: { message: '测试操作' }
        };
        
        (global.fetch as vi.Mock).mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue(mockLog)
        });

        // Act
        const result = await logsClient.createLog(logData);

        // Assert
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(logData)
        });
        expect(result).toEqual(mockLog);
      });

      it('should handle creation failure', async () => {
        // Arrange
        const logData = {
          userId: 'user-1',
          userName: '测试用户',
          action: 'CREATE',
          level: 'INFO',
          resourceId: 'resource-1',
          resourceType: 'quote',
          details: { message: '测试操作' }
        };
        
        (global.fetch as vi.Mock).mockResolvedValue({
          ok: false,
          statusText: 'Internal Server Error',
          json: vi.fn().mockResolvedValue({ error: '服务器错误' })
        });

        // Act & Assert
        await expect(logsClient.createLog(logData)).rejects.toThrow('创建日志失败: 服务器错误');
      });
    });

    describe('getLogs', () => {
      it('should fetch all logs without filters', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ 
              data: [
                { ...mockLog, id: 'log-1', user_id: 'user-1', user_name: '测试用户', created_at: '2023-01-01T00:00:00Z', resource_id: 'resource-1', resource_type: 'quote', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' },
                { ...mockLogs[1], id: 'log-2', user_id: 'user-2', user_name: '测试用户2', created_at: '2023-01-02T00:00:00Z', resource_id: 'resource-2', resource_type: 'order', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' }
              ], 
              count: 2 
            });
            return Promise.resolve({ 
              data: [
                { ...mockLog, id: 'log-1', user_id: 'user-1', user_name: '测试用户', created_at: '2023-01-01T00:00:00Z', resource_id: 'resource-1', resource_type: 'quote', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' },
                { ...mockLogs[1], id: 'log-2', user_id: 'user-2', user_name: '测试用户2', created_at: '2023-01-02T00:00:00Z', resource_id: 'resource-2', resource_type: 'order', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' }
              ], 
              count: 2 
            });
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act
        const result = await logsClient.getLogs({});

        // Assert
        expect(mockCreateClient).toHaveBeenCalledTimes(1);
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('logs');
        expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockQuery.range).toHaveBeenCalledWith(0, 19);
        expect(result).toEqual({
          logs: mockLogs,
          total: 2,
          page: 1,
          pageSize: 20,
          totalPages: 1
        });
      });

      it('should fetch logs with userId filter', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ 
              data: [
                { ...mockLog, id: 'log-1', user_id: 'user-1', user_name: '测试用户', created_at: '2023-01-01T00:00:00Z', resource_id: 'resource-1', resource_type: 'quote', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' }
              ], 
              count: 1 
            });
            return Promise.resolve({ 
              data: [
                { ...mockLog, id: 'log-1', user_id: 'user-1', user_name: '测试用户', created_at: '2023-01-01T00:00:00Z', resource_id: 'resource-1', resource_type: 'quote', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' }
              ], 
              count: 1 
            });
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act
        const result = await logsClient.getLogs({ userId: 'user-1' });

        // Assert
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(result).toEqual({
          logs: [mockLog],
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1
        });
      });
    });

    describe('getLogById', () => {
      it('should fetch log by id', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: { ...mockLog, id: 'log-1', user_id: 'user-1', user_name: '测试用户', created_at: '2023-01-01T00:00:00Z', resource_id: 'resource-1', resource_type: 'quote', ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' }, 
            error: null 
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act
        const result = await logsClient.getLogById('log-1');

        // Assert
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('logs');
        expect(mockQuery.select).toHaveBeenCalledWith('*');
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'log-1');
        expect(mockQuery.single).toHaveBeenCalled();
        expect(result).toEqual(mockLog);
      });

      it('should return null when log not found', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act
        const result = await logsClient.getLogById('non-existent-id');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('deleteLog', () => {
      it('should delete log by id', async () => {
        // Arrange
        const mockQuery = {
          from: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ error: null });
            return Promise.resolve({ error: null });
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act
        const result = await logsClient.deleteLog('log-1');

        // Assert
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('logs');
        expect(mockQuery.delete).toHaveBeenCalled();
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'log-1');
        expect(result).toBe(true);
      });

      it('should handle deletion failure', async () => {
        // Arrange
        const mockQuery = {
          from: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ error: { message: '删除失败' } });
            return Promise.resolve({ error: { message: '删除失败' } });
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act & Assert
        await expect(logsClient.deleteLog('log-1')).rejects.toThrow('删除日志失败: 删除失败');
      });
    });

    describe('cleanupOldLogs', () => {
      it('should cleanup old logs', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          then: vi.fn().mockImplementation((resolve) => {
            resolve({ 
              data: [], 
              count: 50, 
              error: null 
            });
            return Promise.resolve({ 
              data: [], 
              count: 50, 
              error: null 
            });
          })
        };
        
        const mockSupabaseClient = {
          from: vi.fn().mockReturnValue(mockQuery)
        };
        
        mockCreateClient.mockReturnValue(mockSupabaseClient as any);

        // Act
        const result = await logsClient.cleanupOldLogs(30);

        // Assert
        expect(mockSupabaseClient.from).toHaveBeenCalledWith('logs');
        expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
        // 不再比较精确的时间字符串，只检查调用次数和第一个参数
        expect(mockQuery.lt).toHaveBeenCalledTimes(2);
        expect(mockQuery.lt).toHaveBeenNthCalledWith(1, 'created_at', expect.any(String));
        expect(mockQuery.lt).toHaveBeenNthCalledWith(2, 'created_at', expect.any(String));
        expect(result).toBe(50);
      });
    });
  });

  describe('logMeasurementOperation', () => {
    it('should log measurement operation', async () => {
      // Arrange
      const createLogSpy = vi.spyOn(logsService, 'createLog');
      
      // Act
      await logMeasurementOperation(
        'user-1',
        '测试用户',
        'CREATE',
        'INFO',
        'measurement-1',
        { message: '创建测量单' }
      );

      // Assert
      expect(createLogSpy).toHaveBeenCalledWith({
        userId: 'user-1',
        userName: '测试用户',
        action: 'CREATE',
        level: 'INFO',
        resourceId: 'measurement-1',
        resourceType: 'measurement',
        details: { message: '创建测量单' }
      });
    });
  });

  describe('logsService singleton', () => {
    it('should be an instance of LogsClient', () => {
      expect(logsService).toBeInstanceOf(LogsClient);
    });
  });
});
