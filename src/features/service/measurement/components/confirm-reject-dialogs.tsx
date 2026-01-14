'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { reviewMeasureTask } from '../actions/workflows';
import { Label } from '@/shared/ui/label';

interface ConfirmRejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string;
    onSuccess: () => void;
}

export function ConfirmDialog({ open, onOpenChange, taskId, onSuccess }: ConfirmRejectDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await reviewMeasureTask({
                id: taskId,
                action: 'APPROVE',
            });
            if (res.success) {
                toast.success('测量结果已确认');
                onSuccess();
                onOpenChange(false);
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认测量结果</DialogTitle>
                    <DialogDescription>
                        确认后，测量数据将生效并可用于后续报价。确认后不可再次提交修改。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? '确认中...' : '确认验收'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function RejectDialog({ open, onOpenChange, taskId, onSuccess }: ConfirmRejectDialogProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

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
                onSuccess();
                onOpenChange(false);
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button variant="destructive" onClick={handleReject} disabled={loading}>
                        {loading ? '提交中...' : '确认驳回'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
