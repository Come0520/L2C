'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
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
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { requestCancelOrder } from '../actions/cancel';
import { CANCEL_REASONS, CANCELABLE_STATUSES } from '../action-schemas';


export interface CancelOrderDialogProps {
    orderId: string;
    orderNo: string;
    orderStatus: string;
    onSuccess?: () => void;
}

/**
 * 撤单申请Dialog
 */
export function CancelOrderDialog({
    orderId,
    orderNo,
    orderStatus,
    onSuccess,
}: CancelOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<typeof CANCEL_REASONS[number] | ''>('');
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);

    // 检查是否允许撤单
    const canCancel = CANCELABLE_STATUSES.includes(orderStatus as typeof CANCELABLE_STATUSES[number]);

    const handleSubmit = async () => {
        if (!reason) {
            toast.error('请选择撤单原因');
            return;
        }

        setLoading(true);
        try {
            const result = await requestCancelOrder({
                orderId,
                reason,
                remark: remark || undefined,
            });

            if (result.success) {
                toast.success(result.message || '撤单申请已提交');
                setOpen(false);
                setReason('');
                setRemark('');
                onSuccess?.();
            } else {
                toast.error(result.error || '撤单申请失败');
            }
        } catch {
            toast.error('撤单申请失败');
        } finally {
            setLoading(false);
        }
    };

    if (!canCancel) {
        return (
            <Button variant="outline" size="sm" disabled className="opacity-50">
                <XCircle className="h-4 w-4 mr-1" />
                撤单
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <XCircle className="h-4 w-4 mr-1" />
                    申请撤单
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        申请撤单
                    </DialogTitle>
                    <DialogDescription>
                        您正在申请撤销订单 <span className="font-bold text-foreground">{orderNo}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* 撤单原因 */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">撤单原因 <span className="text-red-500">*</span></Label>
                        <Select
                            value={reason}
                            onValueChange={(value) => setReason(value as typeof CANCEL_REASONS[number])}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="请选择撤单原因" />
                            </SelectTrigger>
                            <SelectContent>
                                {CANCEL_REASONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 备注说明 */}
                    <div className="space-y-2">
                        <Label htmlFor="remark">备注说明</Label>
                        <Textarea
                            id="remark"
                            placeholder="请补充详细说明（选填）"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* 提示信息 */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium">注意事项</p>
                                <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                                    <li>撤单申请将提交审批流程</li>
                                    <li>审批通过后订单将被取消</li>
                                    <li>已收款项将按流程处理退款</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        取消
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading || !reason}
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        提交撤单申请
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CancelOrderDialog;
