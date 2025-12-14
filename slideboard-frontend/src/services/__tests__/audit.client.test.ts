import { describe, it, expect, vi, beforeEach } from 'vitest';

import { auditClientService } from '../audit.client';

// 模拟 fetch API
global.fetch = vi.fn();

// 测试数据
const mockAuditLog = {
  id: 'audit-1',
  action: 'CREATE',
  entityType: 'QUOTE',
  entityId: 'quote-1',
  userId: 'user-1',
  ipAddress: '127.0.0.1',
  timestamp: '2023-01-01T00:00:00Z',
  details: { name: '测试报价' }
};

const mockAuditLogs = {
  logs: [
    mockAuditLog,
    {
      id: 'audit-2',
      action: 'UPDATE',
      entityType: 'QUOTE',
      entityId: 'quote-1',
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      timestamp: '2023-01-02T00:00:00Z',
      details: { status: 'APPROVED' }
    }
  ],
  total: 2
};

describe('Audit Client Service', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should log audit entry successfully', async () => {
      // Arrange
      const auditEntry = {
        action: 'CREATE',
        entityType: 'QUOTE',
        entityId: 'quote-1',
        details: { name: '测试报价' }
      };
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAuditLog)
      });

      // Act
      const result = await auditClientService.log(auditEntry);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditEntry)
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle log failure', async () => {
      // Arrange
      const auditEntry = {
        action: 'CREATE',
        entityType: 'QUOTE',
        entityId: 'quote-1',
        details: { name: '测试报价' }
      };
      
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false
      });

      // Act & Assert
      await expect(auditClientService.log(auditEntry)).rejects.toThrow('Failed to log audit');
    });
  });

  describe('getLogs', () => {
    it('should fetch all logs without filters', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAuditLogs)
      });

      // Act
      const result = await auditClientService.getLogs({});

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/list?');
      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch logs with entityType filter', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAuditLogs)
      });

      // Act
      const result = await auditClientService.getLogs({ entityType: 'QUOTE' });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/list?entityType=QUOTE');
      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch logs with userId filter', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAuditLogs)
      });

      // Act
      const result = await auditClientService.getLogs({ userId: 'user-1' });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/list?userId=user-1');
      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch logs with pagination', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAuditLogs)
      });

      // Act
      const result = await auditClientService.getLogs({ limit: 10, offset: 20 });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/list?limit=10&offset=20');
      expect(result).toEqual(mockAuditLogs);
    });

    it('should fetch logs with all filters', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockAuditLogs)
      });

      // Act
      const result = await auditClientService.getLogs({ 
        entityType: 'QUOTE', 
        userId: 'user-1', 
        limit: 10, 
        offset: 20 
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/audit/list?entityType=QUOTE&userId=user-1&limit=10&offset=20');
      expect(result).toEqual(mockAuditLogs);
    });

    it('should handle fetch failure', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false
      });

      // Act & Assert
      await expect(auditClientService.getLogs({})).rejects.toThrow('Failed to fetch logs');
    });
  });
});
