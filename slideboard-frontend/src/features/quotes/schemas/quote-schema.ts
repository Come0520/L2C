import { z } from 'zod';

export const quoteItemSchema = z.object({
  category: z.string().default('standard'),
  space: z.string().default('default'),
  productName: z.string().min(1, '请输入产品名称'),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.number().min(1, '数量必须大于0'),
  unitPrice: z.number().min(0, '单价不能为负'),
  totalPrice: z.number().min(0, '总价不能为负'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  unit: z.string().optional(),
});

export const createQuoteSchema = z.object({
  projectName: z.string().min(1, '请输入项目名称'),
  projectAddress: z.string().optional(),
  customerId: z.string().optional(),
  items: z.array(quoteItemSchema).optional(),
});

export const updateQuoteVersionSchema = z.object({
  items: z.array(quoteItemSchema),
  totalAmount: z.number().min(0),
});

export type QuoteItemFormData = z.infer<typeof quoteItemSchema>;
export type CreateQuoteFormData = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteVersionFormData = z.infer<typeof updateQuoteVersionSchema>;
