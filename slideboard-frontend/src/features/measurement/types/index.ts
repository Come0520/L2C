import { z } from 'zod';

export type MeasurementStatus = 'pending' | 'assigned' | 'completed' | 'cancelled';

export interface MeasurementTask {
  id: string;
  orderId: string; // 关联的销售单ID
  customerName: string;
  customerPhone: string;
  address: string;
  status: MeasurementStatus;
  assignedTo?: string; // 测量员ID
  assignedToName?: string;
  appointmentTime?: string; // 预约时间
  completedTime?: string;
  remarks?: string;
  measurements?: Record<string, any>; // 测量数据，具体结构待定
  createdAt?: string; // Add createdAt to match mock data
  updatedAt?: string;
}

export const measurementTaskSchema = z.object({
  orderId: z.string().min(1, '关联订单不能为空'),
  assignedTo: z.string().optional(),
  appointmentTime: z.string().optional(),
  remarks: z.string().optional(),
});

export type MeasurementTaskFormData = z.infer<typeof measurementTaskSchema>;
