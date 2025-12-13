import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installationScheduleService, CreateInstallationScheduleRequest } from '../installation-schedule.client';
import { createClient } from '@/lib/supabase/client';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}));

vi.mock('./notifications', () => ({
  notificationService: {
    createInstallationNotification: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('InstallationScheduleService', () => {
  // 创建mock查询对象
  const createMockQuery = (data: any = null, count: number | null = null, error: any = null) => {
    const mockQuery: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      then: vi.fn((onFulfilled: any) => onFulfilled({ data, count, error })),
      async: vi.fn().mockReturnThis()
    };
    return mockQuery;
  };

  // 创建mock supabase客户端
  const createMockSupabaseClient = (authUser: any = null, data: any = null, count: number | null = null, error: any = null) => {
    const mockQuery = createMockQuery(data, count, error);
    return {
      from: vi.fn(() => mockQuery),
      rpc: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: authUser } })
      }
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Helper Methods', () => {
    it('should calculate duration correctly', () => {
      // Act
      const duration = installationScheduleService.calculateDuration('09:00', '11:30');
      
      // Assert
      expect(duration).toBe(150); // 2.5 hours = 150 minutes
    });

    it('should check time overlap correctly', () => {
      // Act & Assert
      expect(installationScheduleService.isTimeOverlap('09:00', '10:00', '09:30', '11:00')).toBe(true); // Overlap
      expect(installationScheduleService.isTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false); // No overlap
      expect(installationScheduleService.isTimeOverlap('09:00', '10:00', '08:00', '08:30')).toBe(false); // No overlap
    });

    it('should add minutes to time string correctly', () => {
      // Act & Assert
      expect(installationScheduleService.addMinutes('09:00', 30)).toBe('09:30');
      expect(installationScheduleService.addMinutes('23:45', 30)).toBe('24:15');
      expect(installationScheduleService.addMinutes('12:00', 120)).toBe('14:00');
    });
  });

  describe('Installation Schedule Management', () => {
    describe('checkInstallerAvailability', () => {
      it('should return true when installer is available', async () => {
        // Arrange
        const mockSupabaseClient = createMockSupabaseClient(null, [], null);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationScheduleService.checkInstallerAvailability(
          'installer1',
          '2025-12-15',
          '09:00',
          '11:00'
        );

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when installer is not available', async () => {
        // Arrange
        const mockSupabaseClient = createMockSupabaseClient(null, [{ id: 'schedule1' }], null);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationScheduleService.checkInstallerAvailability(
          'installer1',
          '2025-12-15',
          '09:00',
          '11:00'
        );

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('getInstallationSchedules', () => {
      it('should return installation schedules with pagination', async () => {
        // Arrange
        const mockData = [
          {
            id: '1',
            installation_id: 'inst1',
            installation_no: 'INS001',
            customer_name: '客户A',
            project_address: '地址1',
            scheduled_date: '2025-12-15',
            time_slot: { startTime: '09:00', endTime: '11:00' },
            estimated_duration: 120,
            installer_id: 'installer1',
            installation_team_id: 'team1',
            status: 'scheduled',
            notes: '测试',
            created_at: '2025-12-10T00:00:00Z',
            updated_at: '2025-12-10T00:00:00Z',
            installer: { name: '安装工A' },
            installation_team: { name: '安装队A' }
          }
        ];
        const mockSupabaseClient = createMockSupabaseClient(null, mockData, 1);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationScheduleService.getInstallationSchedules({ page: 1, pageSize: 10 });

        // Assert
        expect(result.schedules).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.schedules[0].customerName).toBe('客户A');
      });
    });

    describe('getInstallationScheduleById', () => {
      it('should return installation schedule by id', async () => {
        // Arrange
        const mockData = {
          id: '1',
          installation_id: 'inst1',
          installation_no: 'INS001',
          customer_name: '客户A',
          project_address: '地址1',
          scheduled_date: '2025-12-15',
          time_slot: { startTime: '09:00', endTime: '11:00' },
          estimated_duration: 120,
          installer_id: 'installer1',
          installation_team_id: 'team1',
          status: 'scheduled',
          notes: '测试',
          created_at: '2025-12-10T00:00:00Z',
          updated_at: '2025-12-10T00:00:00Z',
          installer: { name: '安装工A' },
          installation_team: { name: '安装队A' }
        };
        const mockSupabaseClient = createMockSupabaseClient(null, mockData);
        (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

        // Act
        const result = await installationScheduleService.getInstallationScheduleById('1');

        // Assert
        expect(result.id).toBe('1');
        expect(result.customerName).toBe('客户A');
      });
    });
  });

  describe('Installation Calendar', () => {
    it('should return installation calendar for a month', async () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          installation_no: 'INS001',
          customer_name: '客户A',
          scheduled_date: '2025-12-15',
          time_slot: { startTime: '09:00', endTime: '11:00' },
          status: 'scheduled',
          installation_id: 'inst1'
        }
      ];
      const mockSupabaseClient = createMockSupabaseClient(null, mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await installationScheduleService.getInstallationCalendar(2025, 12);

      // Assert
      expect(result).toHaveLength(31); // December has 31 days
      const day15 = result.find(item => item.date === '2025-12-15');
      expect(day15?.hasInstallations).toBe(true);
      expect(day15?.totalInstallations).toBe(1);
    });
  });

  describe('Installation Route Plan', () => {
    it('should get installation route plan by id', async () => {
      // Arrange
      const mockData = {
        id: 'plan1',
        date: '2025-12-15',
        installer_id: 'installer1',
        total_travel_time: 60,
        total_travel_distance: 20,
        estimated_start_time: '09:00',
        estimated_end_time: '17:00',
        created_at: '2025-12-10T00:00:00Z',
        updated_at: '2025-12-10T00:00:00Z',
        installer: { name: '安装工A' },
        plan_installations: [
          {
            id: 'plan_inst1',
            installation_id: 'inst1',
            sequence: 1,
            estimated_travel_time: 0,
            estimated_travel_distance: 0,
            installation: {
              installation_no: 'INS001',
              customer_name: '客户A',
              project_address: '地址1',
              time_slot: { startTime: '09:00', endTime: '11:00' }
            }
          }
        ]
      };
      const mockSupabaseClient = createMockSupabaseClient(null, mockData);
      (createClient as vi.Mock).mockReturnValue(mockSupabaseClient);

      // Act
      const result = await installationScheduleService.getInstallationRoutePlan('plan1');

      // Assert
      expect(result.id).toBe('plan1');
      expect(result.installations).toHaveLength(1);
      expect(result.installations[0].customerName).toBe('客户A');
    });
  });
});
