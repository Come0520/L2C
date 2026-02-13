'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { reviewMeasureTask } from '../actions/workflows';
import { Label } from '@/shared/ui/label';

interface ConfirmRejectDialogProps {
    open?: boolean; // make optional
    onOpenChange?: (open: boolean) => void; // make optional
    taskId: string;
    onSuccess?: () => void; // make optional
    trigger?: React.ReactNode;
}

export function ConfirmDialog({ open: controlledOpen, onOpenChange: setControlledOpen, taskId, onSuccess, trigger }: ConfirmRejectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? setControlledOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);

    // 使用 useCallback 稳定回调引用
    const handleClose = useCallback(() => onOpenChange?.(false), [onOpenChange]);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await reviewMeasureTask({
                id: taskId,
                action: 'APPROVE',
            });
            if (res.success) {
                toast.success('测量结果已确认');
                if (onSuccess) onSuccess();
                if (onOpenChange) onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('确认失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认测量结果</DialogTitle>
                    <DialogDescription>
                        确认后，测量数据将生效并可用于后续报价。确认后不可再次提交修改。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>取消</Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? '确认中...' : '确认验收'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RejectDialog({ open: controlledOpen, onOpenChange: setControlledOpen, taskId, onSuccess, trigger }: ConfirmRejectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? setControlledOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

    // 使用 useCallback 稳定回调引用
    const handleRejectClose = useCallback(() => onOpenChange?.(false), [onOpenChange]);

    const handleReject = async () => {
        if (!reason) {
            toast.error('请填写驳回原因');
            return;
        }

        setLoading(true);
        try {
            const res = await reviewMeasureTask({
                id: taskId,
                action: 'REJECT',
                reason,
            });
            if (res.success) {
                toast.success('已驳回重测');
                if (onSuccess) onSuccess();
                if (onOpenChange) onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('操作失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>驳回重测</DialogTitle>
                    <DialogDescription>
                        驳回后，状态将回退至"待上门"，测量师需重新提交数据。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="reason">驳回原因</Label>
                        <Textarea
                            id="reason"
                            placeholder="请描述具体问题，以便师傅整改..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleRejectClose}>取消</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading}>
                        {loading ? '提交中...' : '确认驳回'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
