'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import { verifyPaymentBill } from '@/features/finance/actions/ap';
import { toast } from 'sonner';
import { Check, X, CreditCard } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';

interface ApDetailActionsProps {
    billId: string;
    status: string;
}

export function ApDetailActions({ billId, status }: ApDetailActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleVerify = (newStatus: 'VERIFIED' | 'REJECTED') => {
        startTransition(async () => {
            try {
                const result = await verifyPaymentBill({
                    id: billId,
                    status: newStatus,
                    remark: newStatus === 'REJECTED' ? rejectReason : undefined
                });

                if (result.success) {
                    toast.success(newStatus === 'VERIFIED' ? '审批已通过' : '申请已驳回');
                    if (newStatus === 'REJECTED') setIsRejectDialogOpen(false);
                } else {
                    toast.error('操作失败');
                }
            } catch (error) {
                toast.error('网络错误');
            }
        });
    };

    if (status === 'PAID') return null;

    return (
        <div className="flex items-center gap-2">
            {/* 待通过状态 (PENDING/PENDING_APPROVAL) */}
            {(status === 'PENDING' || status === 'PENDING_APPROVAL') && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setIsRejectDialogOpen(true)}
                        disabled={isPending}
                    >
                        <X className="w-4 h-4 mr-1" />
                        驳回
                    </Button>
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerify('VERIFIED')}
                        disabled={isPending}
                    >
                        <Check className="w-4 h-4 mr-1" />
                        通过并支付
                    </Button>
                </>
            )}

            {/* 驳回对话框 */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>驳回申请</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="请输入驳回理由..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>取消</Button>
                        <Button
                            variant="destructive"
                            onClick={() => handleVerify('REJECTED')}
                            disabled={!rejectReason || isPending}
                        >
                            确认驳回
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
