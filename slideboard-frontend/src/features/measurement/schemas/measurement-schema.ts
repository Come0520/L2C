import { z } from 'zod';

export const measurementAssignSchema = z.object({
  assignedTo: z.string().min(1, '请选择测量员'),
  appointmentTime: z.string().min(1, '请选择预约时间'),
  remarks: z.string().optional(),
});

export const measurementCompleteSchema = z.object({
  completedTime: z.string().default(() => new Date().toISOString()),
  measurements: z.record(z.string(), z.any()).optional(), // Fixed: z.record expects key type (usually string) and value type
  remarks: z.string().optional(),
  images: z.array(z.string()).optional(), // Image URLs
});

export type MeasurementAssignFormData = z.infer<typeof measurementAssignSchema>;
export type MeasurementCompleteFormData = z.infer<typeof measurementCompleteSchema>;
