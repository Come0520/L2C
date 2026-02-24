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
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { toast } from 'sonner';
import { customerRejectAction } from '../actions/orders';
import { useRouter } from 'next/navigation';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';

interface RejectOrderDialogProps {
    orderId: string;
    version: number;
    trigger?: React.ReactNode;
}

export function RejectOrderDialog({ orderId, version, trigger }: RejectOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.error('请输入驳回原因');
            return;
        }

        setIsSubmitting(true);
        try {
            await customerRejectAction({ orderId, reason, version });
            toast.success('已驳回验收');
            setOpen(false);
            router.refresh();
        } catch (_error) {
            toast.error('操作失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" /> 驳回
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>驳回验收</DialogTitle>
                    <DialogDescription>
                        请填写驳回原因，以便后续跟进处理。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">驳回原因</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="请输入驳回具体原因..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                        取消
                    </Button>
                    <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认驳回
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
