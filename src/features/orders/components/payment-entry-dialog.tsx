'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { createOrderPayment } from '@/features/orders/actions/order-actions';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { UploadButton } from '@/shared/components/upload-button'; // Assuming we have one or use simple input

interface Props {
    schedule: any;
    orderId: string;
    trigger?: React.ReactNode;
}

export function PaymentEntryDialog({ schedule, orderId, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState(schedule.amount);
    const [method, setMethod] = useState('TRANSFER'); // Default
    const [proofUrl, setProofUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        if (!amount || !proofUrl || !method) {
            toast.error('请填写完整支付信息（含凭证）');
            return;
        }

        setSubmitting(true);
        try {
            const res = await createOrderPayment({
                scheduleId: schedule.id,
                orderId: orderId,
                actualAmount: amount.toString(),
                paymentMethod: method,
                proofImg: proofUrl
            });

            if (res.success) {
                toast.success('支付录入成功');
                setOpen(false);
            } else {
                toast.error(res.error || '录入失败');
            }
        } catch {
            toast.error('网络错误');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm">录入支付</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>录入支付 - {schedule.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>应付金额</Label>
                        <div className="text-lg font-bold">¥{schedule.amount}</div>
                    </div>
                    <div className="grid gap-2">
                        <Label>实收金额 (元)</Label>
                        <Input
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            type="number"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>支付方式</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">现金</SelectItem>
                                <SelectItem value="TRANSFER">转账</SelectItem>
                                <SelectItem value="WECHAT">微信支付</SelectItem>
                                <SelectItem value="ALIPAY">支付宝</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>支付凭证 (必传)</Label>
                        {proofUrl ? (
                            <div className="relative aspect-video w-full rounded-md border overflow-hidden group">
                                <img src={proofUrl} alt="Proof" className="object-cover w-full h-full" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setProofUrl('')}>
                                    <span className="text-white text-xs">更换图片</span>
                                </div>
                            </div>
                        ) : (
                            // Simple placeholder for upload component interaction
                            // In real app use proper Upload component
                            <UploadButton
                                onUploadComplete={(url) => setProofUrl(url)}
                                className="w-full h-32 border-dashed"
                            />
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认录入
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
