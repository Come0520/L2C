import { z } from 'zod';

export const salesOrderSchema = z.object({
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  customerName: z.string().min(1, '客户姓名不能为空'),
  customerPhone: z.string().min(1, '联系电话不能为空'),
  projectAddress: z.string().optional(),
  designer: z.string().optional(),
  salesPerson: z.string().optional(),
  expectedDeliveryTime: z.string().optional(),
  totalAmount: z.number().min(0),
  discountAmount: z.number().min(0).optional(),
  finalAmount: z.number().min(0),
  remarks: z.string().optional(),
  // Add items schema later when we refactor items logic
});

export type SalesOrderFormData = z.infer<typeof salesOrderSchema>;
