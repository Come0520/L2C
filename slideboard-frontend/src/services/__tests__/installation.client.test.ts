import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InstallationAssignFormData, InstallationCompleteFormData } from '@/features/installations/schemas/installation';

import { installationService } from '../installation.client';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
    }
  };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe('InstallationService', () => {
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve({ data: [], error: null }))
    };
    mockSupabase.from.mockReturnValue(mockQuery);
  });

  describe('getTasks', () => {
    it('should return installation tasks when called', async () => {
      const mockData = [
        { 
          id: 'IT20240101', 
          status: 'pending', 
          sales_orders: { sales_no: 'O1', customer: { name: 'C1' } } 
        },
        { 
          id: 'IT20240102', 
          status: 'in_progress', 
          sales_orders: { sales_no: 'O2', customer: { name: 'C2' } } 
        }
      ];
      
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: mockData, error: null }));

      // Act
      const result = await installationService.getTasks();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('IT20240101');
      expect(result[0].status).toBe('pending');
      expect(result[1].id).toBe('IT20240102');
      expect(result[1].status).toBe('in_progress');
    });

    it('should return installation tasks with filters applied', async () => {
       const mockData = [
        { 
          id: 'IT20240101', 
          status: 'pending', 
          sales_orders: { sales_no: 'O1', customer: { name: 'C1' } } 
        },
        { 
          id: 'IT20240102', 
          status: 'pending', 
          sales_orders: { sales_no: 'O2', customer: { name: 'C2' } } 
        }
      ];
      
      mockQuery.then.mockImplementation((resolve: any) => resolve({ data: mockData, error: null }));
      
      // Act
      const result = await installationService.getTasks({ status: 'pending' });

      // Assert
      expect(result).toHaveLength(2);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending');
    });
  });

  describe('getTaskById', () => {
    it('should return installation task by id when found', async () => {
      const mockData = { 
          id: 'IT20240103', 
          status: 'pending', 
          sales_orders: { sales_no: 'O3', customer: { name: '张三' } } 
      };
      
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await installationService.getTaskById('IT20240103');

      // Assert
      expect(result.id).toBe('IT20240103');
      expect(result.customerName).toBe('张三');
      expect(result.status).toBe('pending');
    });

    it('should return task with correct properties', async () => {
      const mockData = { 
          id: 'IT20240104', 
          status: 'pending', 
          created_at: '2024-01-01',
          sales_orders: { 
            sales_no: 'O4', 
            customer: { 
              name: 'C4',
              phone: '123456789',
              project_address: 'Addr4'
            } 
          } 
      };
      
      mockQuery.single.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await installationService.getTaskById('IT20240104');

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('orderId');
      expect(result).toHaveProperty('customerName');
      expect(result).toHaveProperty('customerPhone');
      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('assignTask', () => {
    it('should return true when task is assigned successfully', async () => {
      // Arrange
      const assignData: InstallationAssignFormData = {
        assignedTo: 'USER001',
        appointmentTime: '2025-12-20T14:00:00Z',
        notes: '请按时完成安装任务'
      };

      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.assignTask('IT20240101', assignData);

      // Assert
      expect(result).toBe(true);
      expect(mockQuery.update).toHaveBeenCalled();
    });

    it('should handle assignData correctly', async () => {
      // Arrange
      const assignData: InstallationAssignFormData = {
        assignedTo: 'USER002',
        appointmentTime: '2025-12-21T10:00:00Z'
        // notes 是可选的
      };

      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.assignTask('IT20240101', assignData);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('startTask', () => {
    it('should return true when task is started successfully', async () => {
      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.startTask('IT20240101');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('completeTask', () => {
    it('should return true when task is completed successfully', async () => {
      // Arrange
      const completeData: InstallationCompleteFormData = {
        completedAt: '2025-12-20T16:30:00Z',
        notes: '安装完成，客户满意',
        photos: ['photo1.jpg', 'photo2.jpg']
      };

      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.completeTask('IT20240101', completeData);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle completeData correctly', async () => {
      // Arrange
      const completeData: InstallationCompleteFormData = {
        completedAt: '2025-12-20T16:30:00Z',
        notes: '安装完成'
        // photos 是可选的
      };

      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.completeTask('IT20240101', completeData);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('cancelTask', () => {
    it('should return true when task is cancelled successfully', async () => {
      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.cancelTask('IT20240101');

      // Assert
      expect(result).toBe(true);
    });

    it('should handle cancel with reason', async () => {
      mockQuery.then.mockImplementation((resolve: any) => resolve({ error: null }));

      // Act
      const result = await installationService.cancelTask('IT20240101', '客户取消安装');

      // Assert
      expect(result).toBe(true);
    });
  });
});
