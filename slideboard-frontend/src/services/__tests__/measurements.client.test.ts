import { MEASUREMENT_STATUS } from '@/constants/measurement-status';

import { measurementService } from '../measurements.client';

// Mock the supabase client
const { mockSupabaseClient, createMockQuery } = vi.hoisted(() => {
  const createMockQuery = () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn((onFulfilled) => onFulfilled({ data: null, error: null })),
      catch: vi.fn()
    };
    return query;
  };

  const mockSupabaseClient = {
    from: vi.fn((...args: any[]) => createMockQuery()),
    rpc: vi.fn(),
  };

  return { mockSupabaseClient, createMockQuery };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
}));

// Helper function to reset mock client for each test
beforeEach(() => {
  vi.clearAllMocks();
  // Reset default implementation
  mockSupabaseClient.from.mockImplementation(() => createMockQuery());
});

describe('measurementService', () => {
  describe('createMeasurement', () => {
    it('should create measurement successfully', async () => {
      const mockData = {
        quoteVersionId: 'test-quote-version-id',
        scheduledAt: '2025-01-01T10:00:00Z',
        surveyorId: 'test-surveyor-id',
      };

      const mockSalesOrder = { id: 'test-sales-order-id' };

      const mockMeasurement = {
        id: 'test-measurement-id',
        quote_version_id: 'test-quote-version-id',
        sales_order_id: 'test-sales-order-id',
        status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: {
          customer: {
            name: 'Test Customer',
            project_address: 'Test Address'
          }
        },
        measurer: {
          name: 'Test Measurer'
        }
      };

      // Create separate mock queries for each call
      const mockQuery1 = createMockQuery();
      const mockQuery2 = createMockQuery();

      // Mock first call to get sales order
      mockQuery1.select.mockReturnThis();
      mockQuery1.eq.mockReturnThis();
      mockQuery1.single.mockResolvedValue({ data: mockSalesOrder, error: null });

      // Mock second call to insert measurement
      mockQuery2.insert.mockReturnThis();
      mockQuery2.select.mockReturnThis();
      mockQuery2.single.mockResolvedValue({ data: mockMeasurement, error: null });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'sales_orders') {
          return mockQuery1;
        } else if (tableName === 'measurement_orders') {
          return mockQuery2;
        }
        return createMockQuery();
      });

      const result = await measurementService.createMeasurement(mockData);

      expect(result).toHaveProperty('id', 'test-measurement-id');
      expect(result).toHaveProperty('status', MEASUREMENT_STATUS.PENDING_MEASUREMENT);
    });

    it('should create measurement without sales order successfully', async () => {
      const mockData = {
        quoteVersionId: 'test-quote-version-id',
        scheduledAt: '2025-01-01T10:00:00Z',
        surveyorId: 'test-surveyor-id',
      };

      const mockMeasurement = {
        id: 'test-measurement-id',
        quote_version_id: 'test-quote-version-id',
        sales_order_id: null,
        status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: null,
        measurer: {
          name: 'Test Measurer'
        }
      };

      // Create separate mock queries for each call
      const mockQuery1 = createMockQuery();
      const mockQuery2 = createMockQuery();

      // Mock first call to get sales order (not found)
      mockQuery1.select.mockReturnThis();
      mockQuery1.eq.mockReturnThis();
      mockQuery1.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Mock second call to insert measurement
      mockQuery2.insert.mockReturnThis();
      mockQuery2.select.mockReturnThis();
      mockQuery2.single.mockResolvedValue({ data: mockMeasurement, error: null });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'sales_orders') {
          return mockQuery1;
        } else if (tableName === 'measurement_orders') {
          return mockQuery2;
        }
        return createMockQuery();
      });

      const result = await measurementService.createMeasurement(mockData);

      expect(result).toHaveProperty('id', 'test-measurement-id');
    });

    it('should throw error when creating measurement fails', async () => {
      const mockData = {
        quoteVersionId: 'test-quote-version-id',
        scheduledAt: '2025-01-01T10:00:00Z',
        surveyorId: 'test-surveyor-id',
      };

      // Create separate mock queries for each call
      const mockQuery1 = createMockQuery();
      const mockQuery2 = createMockQuery();

      // Mock first call to get sales order (not found)
      mockQuery1.select.mockReturnThis();
      mockQuery1.eq.mockReturnThis();
      mockQuery1.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      // Mock second call to insert measurement (with error)
      mockQuery2.insert.mockReturnThis();
      mockQuery2.select.mockReturnThis();
      mockQuery2.single.mockResolvedValue({ data: null, error: { message: 'Create measurement failed' } });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'sales_orders') {
          return mockQuery1;
        } else if (tableName === 'measurement_orders') {
          return mockQuery2;
        }
        return createMockQuery();
      });

      await expect(measurementService.createMeasurement(mockData))
        .rejects.toThrow('Create measurement failed');
    });
  });

  describe('updateMeasurement', () => {
    it('should update measurement successfully', async () => {
      const mockCurrentMeasurement = { status: MEASUREMENT_STATUS.PENDING_MEASUREMENT };

      const mockUpdatedMeasurement = {
        id: 'test-measurement-id',
        status: MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT,
        quote_version_id: 'test-quote-version-id',
        measurer_id: 'test-measurer-id',
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: {
          customer: {
            name: 'Test Customer',
            project_address: 'Test Address'
          }
        },
        measurer: {
          name: 'Test Measurer'
        }
      };

      // Create mock queries first
      const mockQuery1 = createMockQuery();
      const mockQuery2 = createMockQuery();

      // Setup the first mock query (get current status)
      mockQuery1.select.mockReturnThis();
      mockQuery1.eq.mockReturnThis();
      mockQuery1.single.mockResolvedValue({ data: mockCurrentMeasurement, error: null });

      // Setup the second mock query (update measurement)
      mockQuery2.update.mockReturnThis();
      mockQuery2.eq.mockReturnThis();
      mockQuery2.select.mockReturnThis();
      mockQuery2.single.mockResolvedValue({ data: mockUpdatedMeasurement, error: null });

      // Set up client.from() to return mock queries in order
      mockSupabaseClient.from.mockReturnValueOnce(mockQuery1).mockReturnValueOnce(mockQuery2);

      const result = await measurementService.updateMeasurement('test-measurement-id', {
        status: MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT
      } as any);

      expect(result).toHaveProperty('id', 'test-measurement-id');
      expect(result).toHaveProperty('status', MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT);
    });

    it('should update measurement attributes without status change', async () => {
      const mockUpdatedMeasurement = {
        id: 'test-measurement-id',
        status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
        scheduled_at: '2025-01-02T10:00:00Z',
        measurer_id: 'new-surveyor-id',
        quote_version_id: 'test-quote-version-id',
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: {
          customer: {
            name: 'Test Customer',
            project_address: 'Test Address'
          }
        },
        measurer: {
          name: 'New Measurer'
        }
      };

      // Create mock query for the single table call
      const mockQuery = createMockQuery();

      // Mock update measurement call with full select
      mockQuery.update.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: mockUpdatedMeasurement, error: null });

      // Set up client.from() to return the mock query
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.updateMeasurement('test-measurement-id', {
        scheduledAt: '2025-01-02T10:00:00Z',
        surveyorId: 'new-surveyor-id'
      } as any);

      expect(result).toHaveProperty('id', 'test-measurement-id');
      expect(result).toHaveProperty('status', MEASUREMENT_STATUS.PENDING_MEASUREMENT);
      expect(result).toHaveProperty('scheduledAt', '2025-01-02T10:00:00Z');
      expect(result).toHaveProperty('surveyorId', 'new-surveyor-id');
    });

    it('should throw error for invalid status transition', async () => {
      const mockCurrentMeasurement = { status: MEASUREMENT_STATUS.COMPLETED };

      // Mock call to get current status
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: mockCurrentMeasurement, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.updateMeasurement('test-measurement-id', {
        status: MEASUREMENT_STATUS.PENDING_MEASUREMENT
      } as any))
        .rejects.toThrow('Invalid status transition');
    });

    it('should throw error when update fails', async () => {
      // Create mock query for the single table call
      const mockQuery = createMockQuery();

      // Mock update measurement call with error
      mockQuery.update.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Update measurement failed' } 
      });

      // Set up client.from() to return the mock query
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.updateMeasurement('test-measurement-id', {
        scheduledAt: '2025-01-02T10:00:00Z'
      } as any))
        .rejects.toThrow('Update measurement failed');
    });
  });

  describe('updateMeasurementStatus', () => {
    it('should update measurement status to completed', async () => {
      // Test transition: pending_measurement -> completed
      const mockCurrentMeasurement = { status: MEASUREMENT_STATUS.PENDING_MEASUREMENT };
      const mockUpdatedMeasurement = {
        id: 'test-measurement-id',
        status: MEASUREMENT_STATUS.COMPLETED,
        quote_version_id: 'test-quote-version-id',
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: {
          customer: {
            name: 'Test Customer',
            project_address: 'Test Address'
          }
        },
        measurer: {
          name: 'Test Measurer'
        }
      };

      // Create mock queries first
      const mockQuery1 = createMockQuery();
      const mockQuery2 = createMockQuery();

      // Setup the first mock query (get current status)
      mockQuery1.select.mockReturnThis();
      mockQuery1.eq.mockReturnThis();
      mockQuery1.single.mockResolvedValue({ data: mockCurrentMeasurement, error: null });

      // Setup the second mock query (update measurement)
      mockQuery2.update.mockReturnThis();
      mockQuery2.eq.mockReturnThis();
      mockQuery2.select.mockReturnThis();
      mockQuery2.single.mockResolvedValue({ data: mockUpdatedMeasurement, error: null });

      // Set up client.from() to return mock queries in order
      mockSupabaseClient.from.mockReturnValueOnce(mockQuery1).mockReturnValueOnce(mockQuery2);

      const result = await measurementService.updateMeasurementStatus('test-measurement-id', MEASUREMENT_STATUS.COMPLETED);

      expect(result).toHaveProperty('id', 'test-measurement-id');
      expect(result).toHaveProperty('status', MEASUREMENT_STATUS.COMPLETED);
    });

    it('should update measurement status to measuring_pending_assignment', async () => {
      // Test transition: pending_measurement -> measuring_pending_assignment
      const mockCurrentMeasurement = { status: MEASUREMENT_STATUS.PENDING_MEASUREMENT };
      const mockUpdatedMeasurement = {
        id: 'test-measurement-id',
        status: MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT,
        quote_version_id: 'test-quote-version-id',
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: {
          customer: {
            name: 'Test Customer',
            project_address: 'Test Address'
          }
        },
        measurer: {
          name: 'Test Measurer'
        }
      };

      // Create mock queries first
      const mockQuery1 = createMockQuery();
      const mockQuery2 = createMockQuery();

      // Setup the first mock query (get current status)
      mockQuery1.select.mockReturnThis();
      mockQuery1.eq.mockReturnThis();
      mockQuery1.single.mockResolvedValue({ data: mockCurrentMeasurement, error: null });

      // Setup the second mock query (update measurement)
      mockQuery2.update.mockReturnThis();
      mockQuery2.eq.mockReturnThis();
      mockQuery2.select.mockReturnThis();
      mockQuery2.single.mockResolvedValue({ data: mockUpdatedMeasurement, error: null });

      // Set up client.from() to return mock queries in order
      mockSupabaseClient.from.mockReturnValueOnce(mockQuery1).mockReturnValueOnce(mockQuery2);

      const result = await measurementService.updateMeasurementStatus('test-measurement-id', MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT);

      expect(result).toHaveProperty('id', 'test-measurement-id');
      expect(result).toHaveProperty('status', MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT);
    });

    it('should throw error for invalid status transition in updateMeasurementStatus', async () => {
      const mockCurrentMeasurement = { status: MEASUREMENT_STATUS.COMPLETED };

      // Mock call to get current status
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: mockCurrentMeasurement, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.updateMeasurementStatus('test-measurement-id', MEASUREMENT_STATUS.PENDING_MEASUREMENT))
        .rejects.toThrow('Invalid status transition from completed to pending_measurement');
    });
  });

  describe('uploadMeasurementReport', () => {
    it('should upload measurement report successfully', async () => {
      const mockMeasurement = {
        id: 'test-measurement-id',
        measurement_report_url: 'test-report-url',
        quote_version_id: 'test-quote-version-id',
        quote_version: {
          quote: {
            id: 'test-quote-id',
            quote_no: 'QUOTE001'
          }
        },
        sales_order: {
          customer: {
            name: 'Test Customer',
            project_address: 'Test Address'
          }
        },
        measurer: {
          name: 'Test Measurer'
        }
      };

      // Mock call to update measurement report
      const mockQuery = createMockQuery();
      mockQuery.update.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: mockMeasurement, error: null });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.uploadMeasurementReport('test-measurement-id', { reportUrl: 'test-report-url' });

      expect(result).toHaveProperty('id', 'test-measurement-id');
    });

    it('should throw error when uploading measurement report fails', async () => {
      // Mock call to update measurement report with error
      const mockQuery = createMockQuery();
      mockQuery.update.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.select.mockReturnThis();
      mockQuery.single.mockResolvedValue({ data: null, error: { message: 'Upload measurement report failed' } });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.uploadMeasurementReport('test-measurement-id', { reportUrl: 'test-report-url' }))
        .rejects.toThrow('Upload measurement report failed');
    });
  });

  describe('getMeasurements', () => {
    it('should get measurements list successfully', async () => {
      const mockMeasurements = [
        {
          id: 'measurement-1',
          status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
          quote_version_id: 'test-quote-version-id',
          measurer_id: 'test-measurer-id',
          scheduled_at: '2025-01-01T10:00:00Z',
          quote_version: {
            quote: {
              id: 'test-quote-id',
              quote_no: 'QUOTE001'
            }
          },
          sales_order: {
            customer: {
              name: 'Test Customer',
              project_address: 'Test Address'
            }
          },
          measurer: {
            name: 'Test Measurer'
          }
        },
      ];

      // Mock call to get measurements
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.range.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: mockMeasurements,
        count: 1,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.getMeasurements();

      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('total', 1);
      expect(result.measurements).toHaveLength(1);
      expect(result.measurements[0]).toHaveProperty('id', 'measurement-1');
    });

    it('should get measurements with status filter', async () => {
      const mockMeasurements = [
        {
          id: 'measurement-1',
          status: MEASUREMENT_STATUS.COMPLETED,
          quote_version_id: 'test-quote-version-id',
          measurer_id: 'test-measurer-id',
          scheduled_at: '2025-01-01T10:00:00Z',
          quote_version: {
            quote: {
              id: 'test-quote-id',
              quote_no: 'QUOTE001'
            }
          },
          sales_order: {
            customer: {
              name: 'Test Customer',
              project_address: 'Test Address'
            }
          },
          measurer: {
            name: 'Test Measurer'
          }
        },
      ];

      // Mock call to get measurements with status filter
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.range.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: mockMeasurements,
        count: 1,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.getMeasurements(1, 10, MEASUREMENT_STATUS.COMPLETED);

      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('total', 1);
      expect(result.measurements).toHaveLength(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', MEASUREMENT_STATUS.COMPLETED);
    });

    it('should get measurements with sales order filter', async () => {
      const mockMeasurements = [
        {
          id: 'measurement-1',
          status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
          quote_version_id: 'test-quote-version-id',
          sales_order_id: 'test-sales-order-id',
          measurer_id: 'test-measurer-id',
          scheduled_at: '2025-01-01T10:00:00Z',
          quote_version: {
            quote: {
              id: 'test-quote-id',
              quote_no: 'QUOTE001'
            }
          },
          sales_order: {
            customer: {
              name: 'Test Customer',
              project_address: 'Test Address'
            }
          },
          measurer: {
            name: 'Test Measurer'
          }
        },
      ];

      // Mock call to get measurements with sales order filter
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.range.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: mockMeasurements,
        count: 1,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.getMeasurements(1, 10, undefined, 'test-sales-order-id');

      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('total', 1);
      expect(result.measurements).toHaveLength(1);
      expect(mockQuery.eq).toHaveBeenCalledWith('sales_order_id', 'test-sales-order-id');
    });

    it('should get measurements with measurement number filter', async () => {
      const mockMeasurements = [
        {
          id: 'measurement-1',
          status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
          measurement_no: 'MEAS001',
          quote_version_id: 'test-quote-version-id',
          measurer_id: 'test-measurer-id',
          scheduled_at: '2025-01-01T10:00:00Z',
          quote_version: {
            quote: {
              id: 'test-quote-id',
              quote_no: 'QUOTE001'
            }
          },
          sales_order: {
            customer: {
              name: 'Test Customer',
              project_address: 'Test Address'
            }
          },
          measurer: {
            name: 'Test Measurer'
          }
        },
      ];

      // Mock call to get measurements with measurement number filter
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.ilike.mockReturnThis();
      mockQuery.range.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: mockMeasurements,
        count: 1,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.getMeasurements(1, 10, undefined, undefined, undefined, 'MEAS001');

      expect(result).toHaveProperty('measurements');
      expect(result).toHaveProperty('total', 1);
      expect(result.measurements).toHaveLength(1);
      expect(mockQuery.ilike).toHaveBeenCalledWith('measurement_no', '%MEAS001%');
    });

    it('should handle error when getting measurements', async () => {
      // Mock call to get measurements (with error)
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.range.mockReturnThis();
      mockQuery.order.mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Get measurements failed' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.getMeasurements())
        .rejects.toThrow('Get measurements failed');
    });
  });

  describe('getMeasurementById', () => {
    it('should get measurement by id successfully', async () => {
      const mockMeasurement = {
        id: 'test-measurement-id',
        status: MEASUREMENT_STATUS.PENDING_MEASUREMENT,
        sales_order: {
          customer: { name: 'Test Customer', project_address: 'Test Address' }
        },
      };

      // Mock call to get measurement by id
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({
        data: mockMeasurement,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await measurementService.getMeasurementById('test-measurement-id');

      expect(result).toHaveProperty('id', 'test-measurement-id');
    });

    it('should handle error when getting measurement by id', async () => {
      // Mock call to get measurement by id (with error)
      const mockQuery = createMockQuery();
      mockQuery.select.mockReturnThis();
      mockQuery.eq.mockReturnThis();
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Get measurement failed' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.getMeasurementById('test-measurement-id'))
        .rejects.toThrow('Get measurement failed');
    });
  });

  describe('deleteMeasurement', () => {
    it('should delete measurement successfully', async () => {
      // Mock call to delete measurement
      const mockQuery = createMockQuery();
      mockQuery.delete.mockReturnThis();
      mockQuery.eq.mockResolvedValue({
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await measurementService.deleteMeasurement('test-measurement-id');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-measurement-id');
    });

    it('should handle error when deleting measurement', async () => {
      // Mock call to delete measurement (with error)
      const mockQuery = createMockQuery();
      mockQuery.delete.mockReturnThis();
      mockQuery.eq.mockResolvedValue({
        error: { message: 'Delete measurement failed' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(measurementService.deleteMeasurement('test-measurement-id'))
        .rejects.toThrow('Delete measurement failed');
    });
  });

  describe('batchRemindMeasurements', () => {
    it('should batch remind measurements successfully', async () => {
      const mockMeasurements = [
        {
          id: 'measurement-1',
          quote_version: {
            quote: { quote_no: 'QUOTE001' },
          },
          scheduled_at: '2025-01-01T10:00:00Z',
          measurer_id: 'measurer-1'
        },
      ];

      // Mock first call to get measurements
      const mockQuery1 = createMockQuery();
      mockQuery1.select.mockReturnThis();
      mockQuery1.in.mockReturnThis();
      // Override the then method to return the mock measurements
      mockQuery1.then = vi.fn().mockImplementation(function(this: any, onFulfilled) {
        return Promise.resolve(onFulfilled({ data: mockMeasurements, error: null }));
      });

      // Mock second call to insert notifications
      const mockQuery2 = createMockQuery();
      mockQuery2.insert.mockReturnThis();
      mockQuery2.then = vi.fn().mockImplementation(function(this: any, onFulfilled) {
        return Promise.resolve(onFulfilled({ data: {}, error: null }));
      });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'measurement_orders') {
          return mockQuery1;
        } else if (tableName === 'notifications') {
          return mockQuery2;
        }
        return createMockQuery();
      });

      await measurementService.batchRemindMeasurements(['measurement-1']);

      expect(mockQuery1.in).toHaveBeenCalled();
      expect(mockQuery2.insert).toHaveBeenCalled();
    });

    it('should handle empty measurements list', async () => {
      // Mock first call to get measurements (empty list)
      const mockQuery1 = createMockQuery();
      mockQuery1.select.mockReturnThis();
      mockQuery1.in.mockReturnThis();
      // Override then method to return empty array
      mockQuery1.then = vi.fn().mockImplementation(function(this: any, onFulfilled) {
        return Promise.resolve(onFulfilled({ data: [], error: null }));
      });

      // Mock second call to insert notifications
      const mockQuery2 = createMockQuery();
      mockQuery2.insert.mockReturnThis();

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'measurement_orders') {
          return mockQuery1;
        } else if (tableName === 'notifications') {
          return mockQuery2;
        }
        return createMockQuery();
      });

      await measurementService.batchRemindMeasurements(['measurement-1']);

      expect(mockQuery1.in).toHaveBeenCalled();
      // Should not call insert if no measurements found
      expect(mockQuery2.insert).not.toHaveBeenCalled();
    });

    it('should throw error when getting measurements fails', async () => {
      // Mock first call to get measurements (with error)
      const mockQuery1 = createMockQuery();
      mockQuery1.select.mockReturnThis();
      mockQuery1.in.mockReturnThis();
      // Override then method to return an error
      mockQuery1.then = vi.fn().mockImplementation(function(this: any, onFulfilled) {
        return Promise.resolve(onFulfilled({ data: null, error: { message: 'Failed to get measurements' } }));
      });

      // Set up client.from() to return mock query
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'measurement_orders') {
          return mockQuery1;
        }
        return createMockQuery();
      });

      await expect(measurementService.batchRemindMeasurements(['measurement-1']))
        .rejects.toThrow('Failed to get measurements');
    });

    it('should handle notification insertion errors', async () => {
      // This test verifies that the function doesn't fail completely when one notification fails
      const mockMeasurements = [
        {
          id: 'measurement-1',
          quote_version: {
            quote: { quote_no: 'QUOTE001' },
          },
          scheduled_at: '2025-01-01T10:00:00Z',
          measurer_id: 'measurer-1'
        },
      ];

      // Mock first call to get measurements
      const mockQuery1 = createMockQuery();
      mockQuery1.select.mockReturnThis();
      mockQuery1.in.mockReturnThis();
      // Override then method to return mock measurements
      mockQuery1.then = vi.fn().mockImplementation(function(this: any, onFulfilled) {
        return Promise.resolve(onFulfilled({ data: mockMeasurements, error: null }));
      });

      // Mock second call to insert notifications (with error)
      const mockQuery2 = createMockQuery();
      mockQuery2.insert.mockReturnThis();
      // Override then method to return error
      mockQuery2.then = vi.fn().mockImplementation(function(this: any, onFulfilled) {
        return Promise.resolve(onFulfilled({ data: null, error: { message: 'Failed to insert notification' } }));
      });

      // Set up client.from() to return different mocks for each call
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'measurement_orders') {
          return mockQuery1;
        } else if (tableName === 'notifications') {
          return mockQuery2;
        }
        return createMockQuery();
      });

      // The function should not throw, but should handle the error internally
      await measurementService.batchRemindMeasurements(['measurement-1']);

      expect(mockQuery1.in).toHaveBeenCalled();
      expect(mockQuery2.insert).toHaveBeenCalled();
    });
  });
});
