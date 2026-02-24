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
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Image from 'next/image';
import { UploadButton } from '@/shared/components/upload-button';

interface PaymentSchedule {
  id: string;
  name: string;
  amount: string;
  actualAmount?: string | null;
  paymentMethod?: string | null;
  expectedDate?: string | null;
  actualDate?: string | null;
  status?: string | null;
  proofImg?: string | null;
}

interface Props {
  schedule: PaymentSchedule;
  orderId: string;
  trigger?: React.ReactNode;
}

export function PaymentEntryDialog({ schedule, orderId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(schedule.amount);
  const [method, setMethod] = useState('BANK'); // Default
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
        proofImg: proofUrl,
      });

      if (res.success) {
        toast.success('支付录入成功');
        setOpen(false);
      } else {
        toast.error('error' in res ? String(res.error) : '录入失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button size="sm">录入支付</Button>}</DialogTrigger>
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
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          </div>
          <div className="grid gap-2">
            <Label>支付方式</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">现金</SelectItem>
                <SelectItem value="BANK">银行转账</SelectItem>
                <SelectItem value="WECHAT">微信支付</SelectItem>
                <SelectItem value="ALIPAY">支付宝</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>支付凭证 (必传)</Label>
            {proofUrl ? (
              <div className="group relative aspect-video w-full overflow-hidden rounded-md border">
                <Image src={proofUrl} alt="Proof" fill className="object-cover" />
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => setProofUrl('')}
                >
                  <span className="text-xs text-white">更换图片</span>
                </div>
              </div>
            ) : (
              // Simple placeholder for upload component interaction
              // In real app use proper Upload component
              <UploadButton
                onUploadComplete={(url) => setProofUrl(url)}
                className="h-32 w-full border-dashed"
              />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认录入
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
