import { z } from 'zod';

export type InstallationStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface InstallationTask {
  id: string;
  orderId: string; // 关联的销售单ID
  customerName: string;
  customerPhone: string;
  address: string;
  status: InstallationStatus;
  assignedTo?: string; // 安装工ID或团队ID
  assignedToName?: string;
  appointmentTime?: string; // 预约安装时间
  completedTime?: string;
  remarks?: string;
  items?: any[]; // 安装项目清单
  createdAt?: string; // Add createdAt to match mock data
  updatedAt?: string;
}

export const installationTaskSchema = z.object({
  orderId: z.string().min(1, '关联订单不能为空'),
  assignedTo: z.string().optional(),
  appointmentTime: z.string().optional(),
  remarks: z.string().optional(),
});

export type InstallationTaskFormData = z.infer<typeof installationTaskSchema>;
