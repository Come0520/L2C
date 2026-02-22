'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { requestDelivery } from '../actions/orders';
import { useRouter } from 'next/navigation';

interface DeliveryRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    version: number;
}

const CARRIERS = [
    { value: 'shunfeng', label: '顺丰速运' },
    { value: 'jingdong', label: '京东物流' },
    { value: 'debang', label: '德邦快递' },
    { value: 'zhongtong', label: '中通快递' },
    { value: 'yuantong', label: '圆通速递' },
    { value: 'yunda', label: '韵达快递' },
    { value: 'huolala', label: '货拉拉' },
    { value: 'other', label: '其他/自送' },
];

export function DeliveryRequestDialog({
    open,
    onOpenChange,
    orderId,
    version,
}: DeliveryRequestDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        carrier: '',
        trackingNo: '',
        remark: '',
    });

    const handleSubmit = async () => {
        if (!formData.carrier) {
            toast.error('请选择物流公司');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await requestDelivery({
                orderId,
                company: formData.carrier,
                trackingNo: formData.trackingNo,
                remark: formData.remark,
                version,
            });

            if (result.success) {
                toast.success('发货申请已提交');
                onOpenChange(false);
                router.refresh();
            } else {
                toast.error('提交失败');
            }
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : '提交失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>申请发货</DialogTitle>
                    <DialogDescription>
                        填写物流信息并确认发货，订单状态将变更为"待安装"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>物流公司</Label>
                        <Select
                            value={formData.carrier}
                            onValueChange={(val) => setFormData({ ...formData, carrier: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择物流公司" />
                            </SelectTrigger>
                            <SelectContent>
                                {CARRIERS.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        {c.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>物流单号</Label>
                        <Input
                            placeholder="请输入快递单号/车牌号"
                            value={formData.trackingNo}
                            onChange={(e) => setFormData({ ...formData, trackingNo: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>备注信息</Label>
                        <Textarea
                            placeholder="如有特别说明请填写"
                            value={formData.remark}
                            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        确认发货
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
