import { installationService } from '../installations.client';

// Mock the supabase client - using a simpler approach that should work with Vitest's mocking
vi.mock('@/lib/supabase/client', () => {
  // Create a mock query object that returns itself for all methods
  const mockSupabaseQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  const mockClient = {
    from: vi.fn(() => mockSupabaseQuery),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } } })),
    },
  };

  // Make mock objects available globally for test cases
  (global as any).mockSupabaseQuery = mockSupabaseQuery;
  (global as any).mockClient = mockClient;

  return {
    createClient: vi.fn(() => mockClient),
    supabase: mockClient,
  };
});

// Access the mock objects from global scope
const mockSupabaseQuery = (global as any).mockSupabaseQuery;
const client = (global as any).mockClient;

describe('installationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 获取最新的mockSupabaseQuery实例
    const currentMockSupabaseQuery = (global as any).mockSupabaseQuery;
    if (currentMockSupabaseQuery) {
      // 重置mockSupabaseQuery的所有方法
      Object.values(currentMockSupabaseQuery).forEach((fn: any) => {
        if (typeof fn === 'function') {
          // 只重置mock函数，不是mockReturnThis()调用返回的对象
          if (fn.mockReset) {
            fn.mockReset();
            fn.mockReturnThis();
          }
        }
      });
    }
  });

  describe('createInstallation', () => {
    it('should create installation successfully', async () => {
      const mockData = { salesOrderId: 'test-sales-order-id', measurementId: 'test-measurement-id', scheduledAt: '2025-01-01T10:00:00Z', installationAddress: 'Test Address', installationContact: 'Test Contact', installationPhone: '13800138000' };

      const mockInstallation = {
        id: 'test-installation-id',
        sales_order_id: 'test-sales-order-id',
        status: 'pending',
        installation_no: 'INST001',
      };

      (client.from().insert().select().single as any).mockResolvedValue({
        data: mockInstallation,
        error: null,
      });

      const result = await installationService.createInstallation(mockData as any);

      expect(result).toHaveProperty('id', 'test-installation-id');
      expect(result).toHaveProperty('status', 'pending');
    });

    it('should throw error when creating installation fails', async () => {
      const mockData = {
        salesOrderId: 'test-sales-order-id',
        scheduledAt: '2025-01-01T10:00:00Z',
        installationAddress: 'Test Address',
      };

      (client.from().insert().select().single as any).mockResolvedValue({
        data: null,
        error: { message: 'Create installation failed' },
      });

      await expect(installationService.createInstallation(mockData as any))
        .rejects.toThrow('Create installation failed');
    });
  });

  describe('updateInstallation', () => {
    it('should update installation successfully', async () => {
      const mockInstallation = {
        id: 'test-installation-id',
        status: 'processing',
        installation_no: 'INST001',
      };


      (client.from().update as any).mockReturnThis();
      (client.from().update().eq as any).mockReturnThis();
      (client.from().update().eq().select as any).mockReturnThis();
      (client.from().update().eq().select().single as any).mockResolvedValue({
        data: mockInstallation,
        error: null,
      });

      const result = await installationService.updateInstallation('test-installation-id', {
        status: 'processing'
      } as any);

      expect(result).toHaveProperty('id', 'test-installation-id');
      expect(result).toHaveProperty('status', 'processing');
    });

    it('should throw error when updating installation fails', async () => {

      (client.from().update as any).mockReturnThis();
      (client.from().update().eq as any).mockReturnThis();
      (client.from().update().eq().select as any).mockReturnThis();
      (client.from().update().eq().select().single as any).mockResolvedValue({
        data: null,
        error: { message: 'Update installation failed' },
      });

      await expect(installationService.updateInstallation('test-installation-id', {
        status: 'processing'
      } as any))
        .rejects.toThrow('Update installation failed');
    });
  });

  describe('updateInstallationStatus', () => {
    it('should update installation status successfully', async () => {
      const mockInstallation = {
        id: 'test-installation-id',
        status: 'completed',
        installation_no: 'INST001',
      };


      (client.from().update as any).mockReturnThis();
      (client.from().update().eq as any).mockReturnThis();
      (client.from().update().eq().select as any).mockReturnThis();
      (client.from().update().eq().select().single as any).mockResolvedValue({
        data: mockInstallation,
        error: null,
      });

      const result = await installationService.updateInstallationStatus('test-installation-id', 'completed');

      expect(result).toHaveProperty('id', 'test-installation-id');
      expect(result).toHaveProperty('status', 'completed');
    });
  });

  describe('updateAcceptanceStatus', () => {
    it('should update acceptance status successfully', async () => {
      const mockInstallation = {
        id: 'test-installation-id',
        acceptance_status: 'passed',
        installation_no: 'INST001',
      };


      (client.from().update as any).mockReturnThis();
      (client.from().update().eq as any).mockReturnThis();
      (client.from().update().eq().select as any).mockReturnThis();
      (client.from().update().eq().select().single as any).mockResolvedValue({
        data: mockInstallation,
        error: null,
      });

      const result = await installationService.updateAcceptanceStatus('test-installation-id', 'passed', 'Test notes');

      expect(result).toHaveProperty('id', 'test-installation-id');
      expect(result).toHaveProperty('acceptanceStatus', 'passed');
    });
  });

  describe('uploadInstallationReport', () => {
    it('should upload installation report successfully', async () => {
      const mockExistingInstallation = {
        installation_data: { existing: 'data' },
      };

      const mockUpdatedInstallation = {
        id: 'test-installation-id',
        installation_data: { existing: 'data', new: 'report' },
        installation_no: 'INST001',
      };


      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      (client.from().select().eq().single as any)
        .mockResolvedValueOnce({ data: mockExistingInstallation, error: null })
        .mockResolvedValueOnce({ data: mockUpdatedInstallation, error: null });
      (client.from().update as any).mockReturnThis();

      const result = await installationService.uploadInstallationReport('test-installation-id', { new: 'report' });

      expect(result).toHaveProperty('id', 'test-installation-id');
    });
  });

  describe('uploadInstallationPhotos', () => {
    it('should upload installation photos successfully', async () => {
      const mockInstallation = {
        id: 'test-installation-id',
        installation_photos: ['photo1.jpg', 'photo2.jpg'],
        installation_no: 'INST001',
      };


      (client.from().update as any).mockReturnThis();
      (client.from().update().eq as any).mockReturnThis();
      (client.from().update().eq().select as any).mockReturnThis();
      (client.from().update().eq().select().single as any).mockResolvedValue({
        data: mockInstallation,
        error: null,
      });

      const result = await installationService.uploadInstallationPhotos('test-installation-id', {
        photoUrls: ['photo1.jpg', 'photo2.jpg']
      });

      expect(result).toHaveProperty('id', 'test-installation-id');
      expect(result.installationPhotos).toEqual(['photo1.jpg', 'photo2.jpg']);
    });
  });

  describe('getInstallations', () => {
    it('should get installations list successfully', async () => {
      const mockInstallations = [
        {
          id: 'installation-1',
          installation_no: 'INST001',
          status: 'pending',
          sales_order: {
            sales_no: 'SO001',
            customer: { name: 'Test Customer', project_address: 'Test Address' }
          },
        },
      ];


      (client.from().select as any).mockReturnThis();
      (client.from().select().range as any).mockReturnThis();
      (client.from().select().range().order as any).mockResolvedValue({
        data: mockInstallations,
        count: 1,
        error: null,
      });

      const result = await installationService.getInstallations();

      expect(result).toHaveProperty('installations');
      expect(result).toHaveProperty('total', 1);
      expect(result.installations).toHaveLength(1);
    });

    it('should handle error when getting installations', async () => {

      (client.from().select as any).mockReturnThis();
      (client.from().select().range as any).mockReturnThis();
      (client.from().select().range().order as any).mockResolvedValue({
        data: null,
        count: 0,
        error: { message: 'Get installations failed' },
      });

      await expect(installationService.getInstallations())
        .rejects.toThrow('Get installations failed');
    });
  });

  describe('getInstallationById', () => {
    it('should get installation by id successfully', async () => {
      const mockInstallation = {
        id: 'test-installation-id',
        installation_no: 'INST001',
        status: 'pending',
        sales_order: {
          sales_no: 'SO001',
          customer: { name: 'Test Customer', phone: '13800138000', project_address: 'Test Address' }
        },
      };

      (client.from().select().eq().single as any).mockResolvedValue({
        data: mockInstallation,
        error: null,
      });

      const result = await installationService.getInstallationById('test-installation-id');

      expect(result).toHaveProperty('id', 'test-installation-id');
      expect(result).toHaveProperty('installationNo', 'INST001');
    });

    it('should handle error when getting installation by id', async () => {

      (client.from().select as any).mockReturnThis();
      (client.from().select().eq as any).mockReturnThis();
      (client.from().select().eq().single as any).mockResolvedValue({
        data: null,
        error: { message: 'Get installation failed' },
      });

      await expect(installationService.getInstallationById('test-installation-id'))
        .rejects.toThrow('Get installation failed');
    });
  });

  describe('deleteInstallation', () => {
    it('should delete installation successfully', async () => {

      (client.from().delete as any).mockReturnThis();
      (client.from().delete().eq as any).mockResolvedValue({
        error: null,
      });

      await installationService.deleteInstallation('test-installation-id');

      expect(client.from().delete().eq).toHaveBeenCalledWith('id', 'test-installation-id');
    });

    it('should handle error when deleting installation', async () => {

      (client.from().delete as any).mockReturnThis();
      (client.from().delete().eq as any).mockResolvedValue({
        error: { message: 'Delete installation failed' },
      });

      await expect(installationService.deleteInstallation('test-installation-id'))
        .rejects.toThrow('Delete installation failed');
    });
  });

  describe('getInstallationCountByStatus', () => {
    it('should get installation count by status successfully', async () => {
      const mockData = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'processing' },
        { status: 'completed' },
      ];


      (client.from().select as any).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await installationService.getInstallationCountByStatus();

      expect(result).toEqual([
        { status: 'pending', count: 2 },
        { status: 'processing', count: 1 },
        { status: 'completed', count: 1 },
      ]);
    });
  });

  describe('getInstallationStatistics', () => {
    it('should get installation statistics successfully', async () => {
      // 变量用于跟踪调用次数
      let countCall = 0;
      
      // 直接mock supabase.from方法，返回一个可以链式调用的对象
      (global as any).mockClient.from = vi.fn(() => {
        // 每次调用from方法时，返回一个新的链式调用对象
        return {
          select: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          // 模拟异步行为，当被await时返回结果
          then: vi.fn(function(resolve: any) {
            countCall++;
            if (countCall === 1) {
              resolve({ count: 10, error: null }); // totalCount
            } else if (countCall === 2) {
              resolve({ count: 6, error: null });  // completedCount
            } else {
              resolve({ count: 2, error: null }); // canceledCount
            }
          })
        };
      });

      const result = await installationService.getInstallationStatistics('2025-01-01', '2025-12-31');

      // 根据实际实现，averageRating总是返回0
      expect(result).toEqual({
        total: 10,
        completed: 6,
        canceled: 2,
        pending: 2,
        averageRating: 0,
      });
    });
  });
});
