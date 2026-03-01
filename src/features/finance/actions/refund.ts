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

/**
 * 提交退款申请 (Submit Refund Request)
 * 验证财务创建权限后，基于底层 createPaymentBill 代理创建退款类型的红字付款单
 * @param data - 退款相关明细（订单号、金额、收款人类型及凭证）
 * @returns 带有 success 标识或 error 的退款账单创建结果
 * @throws 缺少所需权限或参数无效报错
 */
export async function submitRefundRequest(data: z.infer<typeof createRefundRequestSchema>) {
  // 双重防护：入口权限检查
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('未授权');
  if (!(await checkPermission(session, PERMISSIONS.FINANCE.AR_CREATE)))
    throw new Error('权限不足：需要财务创建权限');

  // 执行运行时数据校验
  const parsedData = createRefundRequestSchema.parse(data);

  // Wrap createPaymentBill with REFUND type
  return createPaymentBill({
    type: 'REFUND',
    payeeType: 'CUSTOMER',
    payeeId: parsedData.customerId,
    orderId: parsedData.orderId, // Pass orderId
    payeeName: parsedData.customerName,
    amount: Number(parsedData.amount),
    remark: parsedData.remark || 'Client Refund',
    proofUrl: parsedData.proofUrl,
    paymentMethod: parsedData.paymentMethod, // Schema expects string
    accountId: parsedData.accountId,
  });
}
