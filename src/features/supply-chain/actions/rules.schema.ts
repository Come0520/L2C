import { z } from 'zod';

// Schema for splitting rule input
export const splitRuleSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  priority: z.number().int(),
  conditions: z.string().min(1, '条件不能为空'), // Should be valid JSON string
  targetType: z.enum(['PURCHASE_ORDER', 'SERVICE_TASK']),
  targetSupplierId: z.string().nullable().optional(),
  isActive: z.boolean(),
});

export type SplitRuleInput = z.infer<typeof splitRuleSchema>;
