'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { createOrderFromQuote } from '@/features/orders/actions';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

interface QuoteToOrderButtonProps {
    quoteId: string;
    defaultAmount?: string;
}

export function QuoteToOrderButton({ quoteId, defaultAmount }: QuoteToOrderButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [settlementType, setSettlementType] = useState('PREPAID');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK'>('WECHAT');
    const [paymentAmount, setPaymentAmount] = useState(defaultAmount || '0');
    const [remark, setRemark] = useState('');
    const router = useRouter();

    const handleConvert = () => {
        startTransition(async () => {
            try {
                const result = await createOrderFromQuote({
                    quoteId,
                    paymentMethod,
                    paymentAmount,
                    remark,
                    // Note: paymentProofImg/confirmationImg could be added here if we had a file uploader
                });

                // 检查是否是审批中状态
                if ('pendingApproval' in result && result.pendingApproval) {
                    toast.info(('message' in result ? String(result.message) : undefined) || '已提交审批，请等待审批通过。');
                    setOpen(false);
                    router.refresh();
                    return;
                }

                // 正常订单创建成功
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <ArrowRight className="w-4 h-4" />
                    转为订单
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>报价转订单</DialogTitle>
                    <DialogDescription>
                        请确认以下订单信息，确认后报价单将被锁定。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>结算方式</Label>
                        <Select value={settlementType} onValueChange={setSettlementType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PREPAID">预收款 (PREPAID)</SelectItem>
                                <SelectItem value="CASH">现结 (CASH)</SelectItem>
                                <SelectItem value="CREDIT">月结/授信 (CREDIT)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {settlementType === 'CASH' && (
                        <>
                            <div className="grid gap-2">
                                <Label>支付方式</Label>
                                <Select value={paymentMethod} onValueChange={(v: 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK') => setPaymentMethod(v)}>
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
                        </>
                    )}

                    <div className="grid gap-2">
                        <Label>转化凭证 (图片链接/说明)</Label>
                        <Input placeholder="请输入凭证链接或简单描述" />
                        <p className="text-[10px] text-muted-foreground italic">* 此处应为文件上传，暂时使用文本替代演示</p>
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
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        确认转换
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
