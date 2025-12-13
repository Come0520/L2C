import { z } from 'zod';

export const systemConfigSchema = z.object({
  key: z.string().min(1, '配置键不能为空'),
  value: z.string().min(1, '配置值不能为空'),
  description: z.string().optional(),
  category: z.string().min(1, '分类不能为空'),
});

export type SystemConfigFormValues = z.infer<typeof systemConfigSchema>;
