import { InstallationAssignFormData, InstallationCompleteFormData } from '@/features/installations/schemas/installation';
import { InstallationTask } from '@/features/installations/types';


export const installationService = {
  /**
   * 获取安装任务列表
   */
  async getTasks(_filters?: { status?: string; assignedTo?: string }) {
    // Mock
    return Promise.resolve([
      {
        id: 'IT20240101',
        orderId: 'SO20240101',
        customerName: '张三',
        customerPhone: '13800138000',
        address: '北京市朝阳区某小区',
        status: 'pending',
        createdAt: '2024-01-03T10:00:00Z',
      },
      {
        id: 'IT20240102',
        orderId: 'SO20240102',
        customerName: '李四',
        customerPhone: '13900139000',
        address: '上海市浦东新区某小区',
        status: 'in_progress',
        assignedTo: 'USER005',
        assignedToName: '陈师傅',
        appointmentTime: '2024-01-06T14:00:00Z',
        createdAt: '2024-01-04T11:00:00Z',
      }
    ] as InstallationTask[]);
  },

  /**
   * 获取单个安装任务详情
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
      createdAt: '2024-01-03T10:00:00Z',
    } as InstallationTask);
  },

  /**
   * 分配安装任务
   */
  async assignTask(id: string, data: InstallationAssignFormData) {
    console.log('Assigning installation task', id, data);
    // Mock
    return Promise.resolve(true);
  },

  /**
   * 开始安装任务
   */
  async startTask(id: string) {
      console.log('Starting installation task', id);
      return Promise.resolve(true);
  },

  /**
   * 完成安装任务
   */
  async completeTask(id: string, data: InstallationCompleteFormData) {
    console.log('Completing installation task', id, data);
    // Mock
    return Promise.resolve(true);
  },
  
  /**
   * 取消安装任务
   */
  async cancelTask(id: string, reason?: string) {
      console.log('Cancelling installation task', id, reason);
      return Promise.resolve(true);
  }
};
