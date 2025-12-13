import { MeasurementAssignFormData, MeasurementCompleteFormData } from '@/features/measurement/schemas/measurement-schema';
import { MeasurementTask } from '@/features/measurement/types';
import { createClient } from '@/lib/supabase/client';

export const measurementService = {
  /**
   * 获取测量任务列表
   */
  async getTasks(filters?: { status?: string; assignedTo?: string }) {
    // Mock implementation until backend is ready
    // In real implementation:
    // const supabase = createClient();
    // let query = supabase.from('measurement_tasks').select('*');
    // if (filters?.status) query = query.eq('status', filters.status);
    // ...
    
    // Returning mock data for now
    return Promise.resolve([
      {
        id: 'MT20240101',
        orderId: 'SO20240101',
        customerName: '张三',
        customerPhone: '13800138000',
        address: '北京市朝阳区某小区',
        status: 'pending',
        createdAt: '2024-01-01T10:00:00Z',
      },
      {
        id: 'MT20240102',
        orderId: 'SO20240102',
        customerName: '李四',
        customerPhone: '13900139000',
        address: '上海市浦东新区某小区',
        status: 'assigned',
        assignedTo: 'USER001',
        assignedToName: '王师傅',
        appointmentTime: '2024-01-05T14:00:00Z',
        createdAt: '2024-01-02T11:00:00Z',
      }
    ] as MeasurementTask[]);
  },

  /**
   * 获取单个测量任务详情
   */
  async getTaskById(id: string) {
    // Mock
    return Promise.resolve({
      id,
      orderId: 'SO20240101',
      customerName: '张三',
      customerPhone: '13800138000',
      address: '北京市朝阳区某小区',
      status: 'pending',
      createdAt: '2024-01-01T10:00:00Z',
    } as MeasurementTask);
  },

  /**
   * 分配测量任务
   */
  async assignTask(id: string, data: MeasurementAssignFormData) {
    console.log('Assigning task', id, data);
    // Mock
    return Promise.resolve(true);
  },

  /**
   * 完成测量任务
   */
  async completeTask(id: string, data: MeasurementCompleteFormData) {
    console.log('Completing task', id, data);
    // Mock
    return Promise.resolve(true);
  },
  
  /**
   * 取消测量任务
   */
  async cancelTask(id: string, reason?: string) {
      console.log('Cancelling task', id, reason);
      return Promise.resolve(true);
  }
};
