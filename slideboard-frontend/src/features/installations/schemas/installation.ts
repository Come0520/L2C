import { z } from 'zod';

export const installationAssignSchema = z.object({
  assignedTo: z.string().min(1, '请选择安装工'),
  appointmentTime: z.string().min(1, '请选择预约时间'),
  remarks: z.string().optional(),
});

export const installationCompleteSchema = z.object({
  completedTime: z.string().default(() => new Date().toISOString()),
  remarks: z.string().optional(),
  images: z.array(z.string()).optional(), // 安装完成照片
  items: z.array(z.object({
    id: z.string(),
    status: z.enum(['installed', 'failed']),
    notes: z.string().optional()
  })).optional()
});

export type InstallationAssignFormData = z.infer<typeof installationAssignSchema>;
export type InstallationCompleteFormData = z.infer<typeof installationCompleteSchema>;
