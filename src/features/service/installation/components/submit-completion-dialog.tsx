'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/shared/ui/dialog';
import { checkOutInstallTaskAction } from '../actions';
import { toast } from 'sonner';

interface SubmitInstallCompletionDialogProps {
    taskId: string;
    trigger?: React.ReactNode;
}

export function SubmitInstallCompletionDialog({ taskId, trigger }: SubmitInstallCompletionDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleConfirm() {
        setIsLoading(true);
        try {
            // Check out effectively submits completion for review
            const result = await checkOutInstallTaskAction({
                id: taskId,
                // Location is optional schema wise, passing empty for now or could add geo-location later
            });

            if (result.data?.success) {
                toast.success(result.data.message || '已提交完工申请');
                setOpen(false);
            } else {
                toast.error(result.data?.error || result.error || '提交失败');
            }
        } catch (_error) {
            toast.error('请求失败');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>提交完工</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认提交完工申请？</DialogTitle>
                    <DialogDescription>
                        确认所有安装项已完成并拍摄照片后，点击提交待销售验收。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleConfirm} disabled={isLoading}>
                        {isLoading ? '提交中...' : '确认提交'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
