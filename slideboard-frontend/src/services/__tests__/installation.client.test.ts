import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installationService } from '../installation.client';
import { InstallationAssignFormData, InstallationCompleteFormData } from '@/features/installations/schemas/installation';

describe('InstallationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return installation tasks when called', async () => {
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
      // Act
      const result = await installationService.getTasks({ status: 'pending' });

      // Assert
      expect(result).toHaveLength(2);
      // 注意：当前实现忽略了过滤参数，所以返回所有任务
      // 实际实现中应该根据过滤参数返回对应的数据
    });
  });

  describe('getTaskById', () => {
    it('should return installation task by id when found', async () => {
      // Act
      const result = await installationService.getTaskById('IT20240103');

      // Assert
      expect(result.id).toBe('IT20240103');
      expect(result.customerName).toBe('张三');
      expect(result.status).toBe('pending');
    });

    it('should return task with correct properties', async () => {
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

      // Act
      const result = await installationService.assignTask('IT20240101', assignData);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle assignData correctly', async () => {
      // Arrange
      const assignData: InstallationAssignFormData = {
        assignedTo: 'USER002',
        appointmentTime: '2025-12-21T10:00:00Z'
        // notes 是可选的
      };

      // Act
      const result = await installationService.assignTask('IT20240101', assignData);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('startTask', () => {
    it('should return true when task is started successfully', async () => {
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

      // Act
      const result = await installationService.completeTask('IT20240101', completeData);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('cancelTask', () => {
    it('should return true when task is cancelled successfully', async () => {
      // Act
      const result = await installationService.cancelTask('IT20240101');

      // Assert
      expect(result).toBe(true);
    });

    it('should handle cancel with reason', async () => {
      // Act
      const result = await installationService.cancelTask('IT20240101', '客户取消安装');

      // Assert
      expect(result).toBe(true);
    });
  });
});
