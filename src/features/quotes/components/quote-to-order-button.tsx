'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { createOrderFromQuote } from '@/features/orders/actions';
import { getAvailablePrepayments } from '@/features/finance/actions/receipt';
import { useTenant } from '@/shared/providers/tenant-provider';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { PhotoUpload } from '@/shared/components/photo-upload/photo-upload';

interface QuoteToOrderButtonProps {
  quoteId: string;
  customerId?: string;
  defaultAmount?: string;
}

export function QuoteToOrderButton({
  quoteId,
  customerId,
  defaultAmount,
}: QuoteToOrderButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [settlementType, setSettlementType] = useState('PREPAID');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK'>(
    'WECHAT'
  );
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [remark, setRemark] = useState('');
  const [proofUrls, setProofUrls] = useState<string[]>([]);
  const router = useRouter();

  const { tenant } = useTenant();
  const orderFlowConfig = tenant?.settings?.orderFlowConfig as Record<string, unknown> | undefined;
  const managerApprovalRequired =
    (orderFlowConfig?.managerApprovalRequired as boolean | undefined) ?? true;
  const financeConfirmationRequired =
    (orderFlowConfig?.financeConfirmationRequired as boolean | undefined) ?? true;

  // Available prepayments
  interface PrepaymentBill {
    id: string;
    billNo: string;
    remainingAmount: string | null;
  }
  const [prepayments, setPrepayments] = useState<PrepaymentBill[]>([]);
  const [loadingPrepayments, setLoadingPrepayments] = useState(false);
  const [usedPrepayments, setUsedPrepayments] = useState<string[]>([]);

  const requiredAmount = Number(defaultAmount || '0');
  const totalPrepaymentsSelectedAmount = prepayments
    .filter((p) => usedPrepayments.includes(p.id))
    .reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0);

  const newPaymentAmount = Number(paymentAmount || 0);
  const totalCovered = totalPrepaymentsSelectedAmount + newPaymentAmount;
  const deficit = Math.max(0, requiredAmount - totalCovered);

  useEffect(() => {
    let mounted = true;
    if (open && customerId && settlementType === 'PREPAID') {
      // Delay setting loading state to avoid synchronous setState warning
      Promise.resolve().then(() => {
        if (mounted) setLoadingPrepayments(true);
      });
      getAvailablePrepayments(customerId)
        .then(
          (
            data: Array<{ id: string; receiptNo: string | null; remainingAmount: string | null }>
          ) => {
            if (mounted)
              setPrepayments(
                data.map((b) => ({ ...b, billNo: b.receiptNo || b.id })) as PrepaymentBill[]
              );
          }
        )
        .catch((err: unknown) => {
          console.error('Failed to load prepayments', err);
          if (mounted) toast.error('无法加载预收款列表');
        })
        .finally(() => {
          if (mounted) setLoadingPrepayments(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [open, customerId, settlementType]);

  // Handle initial amount when opening/changing settlement
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      if (settlementType === 'PREPAID') {
        setPaymentAmount('0');
      } else {
        setPaymentAmount(defaultAmount || '0');
      }
    });
    return () => {
      mounted = false;
    };
  }, [settlementType, defaultAmount]);

  const handleConvert = () => {
    startTransition(async () => {
      try {
        let newPaymentInfo:
          | {
              amount: number;
              paymentMethod: 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK';
              proofUrl?: string;
              accountId?: string;
            }
          | undefined = undefined;

        if (settlementType === 'CASH') {
          // 现结，全额通过新付款
          newPaymentInfo = {
            amount: Number(paymentAmount),
            paymentMethod: paymentMethod,
            proofUrl: proofUrls.length > 0 ? JSON.stringify(proofUrls) : undefined,
          };
        } else if (settlementType === 'PREPAID' && newPaymentAmount > 0) {
          // 预收款模式下补充的新付款
          newPaymentInfo = {
            amount: Number(paymentAmount),
            paymentMethod: paymentMethod,
            proofUrl: proofUrls.length > 0 ? JSON.stringify(proofUrls) : undefined,
          };
        }

        const result = await createOrderFromQuote({
          quoteId,
          paymentMethod: settlementType === 'CASH' ? paymentMethod : undefined,
          paymentAmount: settlementType === 'CASH' ? paymentAmount : undefined,
          remark,
          usedPrepayments: settlementType === 'PREPAID' ? usedPrepayments : [],
          newPayment: newPaymentInfo,
        });

        if (result.status === 'PENDING_APPROVAL') {
          toast.info('已提交低定金审批，在通过前订单将处于锁定状态。');
          setOpen(false);
          router.refresh();
          return;
        }

        if ('id' in result && result.id) {
          const order = result as { id: string; orderNo: string };
          toast.success(`订单 ${order.orderNo} 创建成功`);
          setOpen(false);
          router.push(`/orders/${order.id}`);
        } else {
          toast.error('转换失败');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '转换失败，请稍后重试';
        toast.error(message);
      }
    });
  };

  const togglePrepayment = (id: string, checked: boolean) => {
    if (checked) {
      setUsedPrepayments((prev) => [...prev, id]);
    } else {
      setUsedPrepayments((prev) => prev.filter((pId) => pId !== id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <ArrowRight className="mr-2 h-4 w-4" />
          转为订单
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>报价转订单</DialogTitle>
          <DialogDescription>
            请确认以下订单信息，订单总额：
            <span className="text-primary font-semibold">¥{requiredAmount.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4 pr-2">
          <div className="grid gap-2">
            <Label>结算方式</Label>
            <Select value={settlementType} onValueChange={setSettlementType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PREPAID">预收款核销 (PREPAID)</SelectItem>
                <SelectItem value="CASH">直接新付款 (CASH)</SelectItem>
                <SelectItem value="CREDIT">月结/授信 (CREDIT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settlementType === 'PREPAID' && (
            <div className="bg-muted/30 grid gap-3 rounded-lg border p-3">
              <Label className="text-secondary-foreground font-semibold">可用预收款选择</Label>
              {loadingPrepayments ? (
                <div className="text-muted-foreground flex items-center text-sm">
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  加载中...
                </div>
              ) : prepayments.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  该客户当前没有可用的预收款余额。
                </div>
              ) : (
                <div className="space-y-2">
                  {prepayments.map((p) => (
                    <div
                      key={p.id}
                      className="bg-background flex flex-row items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`pre-${p.id}`}
                          checked={usedPrepayments.includes(p.id)}
                          onCheckedChange={(c) => togglePrepayment(p.id, !!c)}
                        />
                        <div className="grid gap-0.5 leading-none">
                          <label htmlFor={`pre-${p.id}`} className="cursor-pointer font-medium">
                            单号: {p.billNo}
                          </label>
                          <span className="text-muted-foreground text-xs">
                            包含余额: ¥{p.remainingAmount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-1 border-t pt-2">
                <Label>补充打款金额 (若预存款不足)</Label>
                <div className="mt-1 flex gap-2">
                  <Select
                    value={paymentMethod}
                    onValueChange={(v: 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK') =>
                      setPaymentMethod(v)
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WECHAT">微信支付</SelectItem>
                      <SelectItem value="ALIPAY">支付宝</SelectItem>
                      <SelectItem value="BANK">银行转账</SelectItem>
                      <SelectItem value="CASH">现金</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="bg-primary/5 text-primary flex items-center justify-between rounded p-2 text-xs">
                <span>已覆盖金额: ¥{totalCovered.toFixed(2)}</span>
                <span className={deficit > 0 ? 'text-destructive font-bold' : ''}>
                  缺口: ¥{deficit.toFixed(2)}
                </span>
              </div>

              {deficit > 0 && managerApprovalRequired && (
                <div className="text-destructive bg-destructive/10 rounded p-2 text-xs">
                  缺口 ¥{deficit.toFixed(2)} 未结清，当前您的门店配置要求此订单需提交至主管审批
                  (低定金下单)。
                </div>
              )}

              {deficit > 0 && !managerApprovalRequired && (
                <div className="rounded bg-amber-50 p-2 text-xs text-amber-600">
                  缺口 ¥{deficit.toFixed(2)} 未结清。当前配置允许直接下单，将自动计算为欠款 (AR)。
                </div>
              )}

              {newPaymentAmount > 0 && financeConfirmationRequired && (
                <div className="rounded bg-blue-50 p-2 text-xs text-blue-600">
                  您录入了 ¥{newPaymentAmount.toFixed(2)} 的补充付款。订单将处于 SIGNED
                  状态，等待财务确收后自动下单。
                </div>
              )}

              {newPaymentAmount > 0 && !financeConfirmationRequired && (
                <div className="rounded bg-green-50 p-2 text-xs text-green-600">
                  您录入了 ¥{newPaymentAmount.toFixed(2)}{' '}
                  的补充付款。当前配置自动确认收款，由于免财务确认，订单将直接下单。
                </div>
              )}
            </div>
          )}

          {settlementType === 'CASH' && (
            <div className="bg-muted/30 grid gap-3 rounded-lg border p-3">
              <div className="grid gap-2">
                <Label>支付方式</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v: 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK') => setPaymentMethod(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WECHAT">微信支付</SelectItem>
                    <SelectItem value="ALIPAY">支付宝</SelectItem>
                    <SelectItem value="BANK">银行转账</SelectItem>
                    <SelectItem value="CASH">现金收款</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>收款金额</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              {Number(paymentAmount) < requiredAmount && managerApprovalRequired && (
                <div className="text-destructive bg-destructive/10 rounded p-2 text-xs">
                  收款不足订单金额，当前您的门店配置要求此订单需提交至主管审批 (欠单发货)。
                </div>
              )}

              {Number(paymentAmount) >= requiredAmount && financeConfirmationRequired && (
                <div className="rounded bg-blue-50 p-2 text-xs text-blue-600">
                  订单将处于 SIGNED 状态，等待财务点确收后进入最终下单生产环节。
                </div>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label>转化凭证 (图片)</Label>
            <PhotoUpload value={proofUrls} onChange={setProofUrls} maxFiles={5} />
            <p className="text-muted-foreground text-[10px] italic">
              * 可选。最多上传 5 张付款截图或转账证明
            </p>
          </div>

          <div className="grid gap-2">
            <Label>备注</Label>
            <Textarea
              placeholder="输入订单备注信息"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button onClick={handleConvert} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : deficit > 0 && settlementType === 'PREPAID' && managerApprovalRequired ? (
              '提交审批'
            ) : (
              '确认转换'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
