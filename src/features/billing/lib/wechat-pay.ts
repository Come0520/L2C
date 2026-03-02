/**
 * 微信支付 V3 封装层 (开发中，暂时 Stub)
 */
export interface WechatNativePayParams {
  description: string;
  outTradeNo: string;
  amountCents: number;
  notifyUrl: string;
  attach?: string;
}

export interface WechatNativePayResult {
  codeUrl: string;
}

export interface WechatPayNotifyOrder {
  outTradeNo: string;
  transactionId: string;
  amountTotal: number;
  tradeState: string;
  openid?: string;
  attach?: string;
  successTime?: string;
}

export interface WechatOrderQueryResult {
  tradeState: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';
  outTradeNo: string;
  transactionId?: string;
  amountTotal?: number;
}

export async function createNativePayOrder(
  params: WechatNativePayParams
): Promise<WechatNativePayResult> {
  throw new Error('微信支付尚未实现');
}

export function decryptWechatCallback(
  ciphertext: string,
  nonce: string,
  associatedData: string
): WechatPayNotifyOrder {
  throw new Error('微信支付尚未实现');
}

export async function verifyWechatSignature(
  headers: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  return false;
}

export async function queryWechatOrder(outTradeNo: string): Promise<WechatOrderQueryResult> {
  throw new Error('微信支付尚未实现');
}

export async function refundWechatOrder(
  outTradeNo: string,
  outRefundNo: string,
  refundAmountCents: number,
  totalAmountCents: number,
  reason?: string
): Promise<void> {
  throw new Error('微信支付尚未实现');
}
