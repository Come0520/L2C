import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLogsClient } from '../auditLogs.client';
import { createClient } from '@/lib/supabase/client';

// 模拟依赖
vi.mock('@/lib/supabase/client');

const mockCreateClient = createClient as vi.Mock;

// 测试数据
const mockAuditLogs = [
  {
    id: 'audit-log-1',
    table_name: 'quotes',
    record_id: 'quote-1',
    changed_by: 'user-1',
    changed_at: '2023-01-01T00:00:00Z',
    change_type: 'UPDATE',
    old_values: { status: 'DRAFT' },
    new_values: { status: 'APPROVED' }
  },
  {
    id: 'audit-log-2',
    table_name: 'quotes',
    record_id: 'quote-2',
    changed_by: 'user-2',
    changed_at: '2023-01-02T00:00:00Z',
    change_type: 'CREATE',
    old_values: null,
    new_values: { status: 'DRAFT', amount: 1000 }
  }
];

describe('Audit Logs Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should fetch all audit logs without filters', async () => {
      // Arrange
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        // 模拟 then 方法，让 query 对象可以被 await
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockAuditLogs, error: null });
          return Promise.resolve({ data: mockAuditLogs, error: null });
        })
      };
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue(mockQuery)
      };
      
      mockCreateClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await auditLogsClient.getAuditLogs({});

      // Assert
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('changed_at', { ascending: false });
      expect(mockQuery.eq).not.toHaveBeenCalled();
      expect(mockQuery.limit).not.toHaveBeenCalled();
      expect(mockQuery.range).not.toHaveBeenCalled();
      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch audit logs by table name', async () => {
      // Arrange
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockAuditLogs, error: null });
          return Promise.resolve({ data: mockAuditLogs, error: null });
        })
      };
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue(mockQuery)
      };
      
      mockCreateClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await auditLogsClient.getAuditLogs({ tableName: 'quotes' });

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledTimes(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('table_name', 'quotes');
      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch audit logs by record ID', async () => {
      // Arrange
      const filteredLogs = [mockAuditLogs[0]];
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: filteredLogs, error: null });
          return Promise.resolve({ data: filteredLogs, error: null });
        })
      };
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue(mockQuery)
      };
      
      mockCreateClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await auditLogsClient.getAuditLogs({ recordId: 'quote-1' });

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledTimes(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('record_id', 'quote-1');
      expect(result).toEqual(filteredLogs);
    });

    it('should fetch audit logs with table name and record ID filters', async () => {
      // Arrange
      const filteredLogs = [mockAuditLogs[0]];
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: filteredLogs, error: null });
          return Promise.resolve({ data: filteredLogs, error: null });
        })
      };
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue(mockQuery)
      };
      
      mockCreateClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await auditLogsClient.getAuditLogs({ 
        tableName: 'quotes', 
        recordId: 'quote-1' 
      });

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledTimes(2);
      expect(mockQuery.eq).toHaveBeenNthCalledWith(1, 'table_name', 'quotes');
      expect(mockQuery.eq).toHaveBeenNthCalledWith(2, 'record_id', 'quote-1');
      expect(result).toEqual(filteredLogs);
    });

    it('should fetch audit logs with pagination', async () => {
      // Arrange
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: mockAuditLogs, error: null });
          return Promise.resolve({ data: mockAuditLogs, error: null });
        })
      };
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue(mockQuery)
      };
      
      mockCreateClient.mockReturnValue(mockSupabaseClient as any);

      // Act
      const result = await auditLogsClient.getAuditLogs({ 
        limit: 10, 
        offset: 20 
      });

      // Assert
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
      expect(result).toEqual(mockAuditLogs);
    });

    it('should handle fetch failure', async () => {
      // Arrange
      const mockError = new Error('Failed to fetch audit logs');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => {
          resolve({ data: null, error: mockError });
          return Promise.resolve({ data: null, error: mockError });
        })
      };
      
      const mockSupabaseClient = {
        from: vi.fn().mockReturnValue(mockQuery)
      };
      
      mockCreateClient.mockReturnValue(mockSupabaseClient as any);

      // Act & Assert
      await expect(auditLogsClient.getAuditLogs({})).rejects.toThrow(`Failed to fetch audit logs: ${mockError.message}`);
    });
  });
});
