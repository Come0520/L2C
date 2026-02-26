import { z } from 'zod';

export const SimpleTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('金额必须大于0'),
  expenseDate: z.date(),
  description: z.string().min(1, '请输入摘要/说明').max(200),
});

export type SimpleTransactionInput = z.infer<typeof SimpleTransactionSchema>;
