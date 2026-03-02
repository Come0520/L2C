/**
 * 支付宝支付封装层 (开发中，暂时 Stub)
 */
export interface AlipayFaceToFaceParams {
  subject: string;
  outTradeNo: string;
  totalAmount: string;
  notifyUrl?: string;
  passbackParams?: string;
}

export interface AlipayPagePayParams {
  subject: string;
  outTradeNo: string;
  totalAmount: string;
  returnUrl: string;
  notifyUrl?: string;
  passbackParams?: string;
}

export interface AlipayFaceToFaceResult {
  qrCode: string;
  tradeNo?: string;
}

export interface AlipayNotifyData {
  outTradeNo: string;
  tradeNo: string;
  tradeStatus: string;
  receiptAmount: string;
  passbackParams?: string;
  sign: string;
  signType: string;
}

export async function createAlipayFaceToFaceOrder(
  params: AlipayFaceToFaceParams
): Promise<AlipayFaceToFaceResult> {
  throw new Error('支付宝支付尚未实现');
}

export function createAlipayPagePayForm(params: AlipayPagePayParams): string {
  throw new Error('支付宝支付尚未实现');
}

export function verifyAlipayNotify(postData: Record<string, string>): boolean {
  return false;
}

export async function queryAlipayOrder(outTradeNo: string): Promise<{
  tradeStatus: string;
  tradeNo?: string;
  totalAmount?: string;
}> {
  throw new Error('支付宝支付尚未实现');
}

export async function refundAlipayOrder(
  outTradeNo: string,
  refundAmount: string,
  refundReason?: string
): Promise<void> {
  throw new Error('支付宝支付尚未实现');
}
