import { describe, it, expect, beforeEach, vi } from 'vitest';
import { batchService } from '../batch.client';

describe('BatchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置fetch mock
    global.fetch = vi.fn();
  });

  describe('bulkUpdateLeadsStatus', () => {
    it('should return success result when API call succeeds', async () => {
      // Arrange
      const mockResponse = {
        successCount: 2,
        failureCount: 0,
        errors: []
      };

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const leadIds = ['lead1', 'lead2'];
      const status = 'qualified';

      // Act
      const result = await batchService.bulkUpdateLeadsStatus(leadIds, status);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/batch/leads/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: leadIds, status })
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return failure result when API call fails', async () => {
      // Arrange
      const errorMessage = 'Internal Server Error';

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(errorMessage)
      });

      const leadIds = ['lead1', 'lead2', 'lead3'];
      const status = 'qualified';

      // Act
      const result = await batchService.bulkUpdateLeadsStatus(leadIds, status);

      // Assert
      expect(result).toEqual({
        successCount: 0,
        failureCount: leadIds.length,
        errors: leadIds.map(id => ({ id, error: errorMessage }))
      });
    });
  });

  describe('bulkUpdateOrdersStatus', () => {
    it('should return success result when API call succeeds', async () => {
      // Arrange
      const mockResponse = {
        successCount: 3,
        failureCount: 1,
        errors: [{ id: 'order4', error: 'Invalid status' }]
      };

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const orderIds = ['order1', 'order2', 'order3', 'order4'];
      const status = 'shipped';

      // Act
      const result = await batchService.bulkUpdateOrdersStatus(orderIds, status);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('/api/batch/orders/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: orderIds, status })
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return failure result when API call fails', async () => {
      // Arrange
      const errorMessage = 'Service Unavailable';

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue(errorMessage)
      });

      const orderIds = ['order1', 'order2'];
      const status = 'shipped';

      // Act
      const result = await batchService.bulkUpdateOrdersStatus(orderIds, status);

      // Assert
      expect(result).toEqual({
        successCount: 0,
        failureCount: orderIds.length,
        errors: orderIds.map(id => ({ id, error: errorMessage }))
      });
    });
  });

  describe('exportData', () => {
    it('should return blob and filename when API call succeeds', async () => {
      // Arrange
      const mockBlob = new Blob(['test,data\n1,2\n3,4'], { type: 'text/csv' });
      const filename = 'leads_export_1234567890.csv';

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
        headers: {
          get: vi.fn().mockReturnValue(`attachment; filename="${filename}"`) 
        }
      });

      // Act
      const result = await batchService.exportData('leads', ['lead1', 'lead2'], 'csv');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/batch/export?resource=leads&format=csv&ids=lead1%2Clead2'), {
        method: 'GET'
      });
      expect(result.blob).toEqual(mockBlob);
      expect(result.filename).toBe(filename);
    });

    it('should use default filename when content-disposition header is not provided', async () => {
      // Arrange
      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
        headers: {
          get: vi.fn().mockReturnValue(null) 
        }
      });

      // Act
      const result = await batchService.exportData('orders', [], 'csv');

      // Assert
      expect(result.filename).toMatch(/orders_export_\d+\.csv/);
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      (global.fetch as vi.Mock).mockResolvedValue({
        ok: false,
        text: vi.fn().mockResolvedValue('Export failed')
      });

      // Act & Assert
      await expect(batchService.exportData('sales_orders')).rejects.toThrow('Failed to export data');
    });

    it('should support different formats', async () => {
      // Arrange
      const mockBlob = new Blob(['<html><body>Test</body></html>'], { type: 'application/pdf' });

      (global.fetch as vi.Mock).mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
        headers: {
          get: vi.fn().mockReturnValue(null) 
        }
      });

      // Act
      await batchService.exportData('leads', [], 'pdf');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('format=pdf'), {
        method: 'GET'
      });
    });
  });
});
