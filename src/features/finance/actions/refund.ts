'use server';

import { createPaymentBill } from './ap';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';

// Simplified schema for Refund Request from UI
const createRefundRequestSchema = z.object({
  orderId: z.string().uuid().optional(), // Linked Order
  customerId: z.string(), // Payee ID (Customer)
  customerName: z.string(),
  amount: z.string(), // valid number string
  remark: z.string().optional(),
  proofUrl: z.string(), // Refund proof/reason doc
  paymentMethod: z.enum(['BANK', 'WECHAT', 'ALIPAY', 'CASH']),
  accountId: z.string().optional(), // From which account we pay
});

export async function submitRefundRequest(data: z.infer<typeof createRefundRequestSchema>) {
  // 双重防护：入口权限检查
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('未授权');
  if (!(await checkPermission(session, PERMISSIONS.FINANCE.AR_CREATE)))
    throw new Error('权限不足：需要财务创建权限');

  // Wrap createPaymentBill with REFUND type
  return createPaymentBill({
    type: 'REFUND',
    payeeType: 'CUSTOMER',
    payeeId: data.customerId,
    orderId: data.orderId, // Pass orderId
    payeeName: data.customerName,
    amount: Number(data.amount),
    remark: data.remark || 'Client Refund',
    proofUrl: data.proofUrl,
    paymentMethod: data.paymentMethod as string, // Schema expects string
    accountId: data.accountId,
  });
}
