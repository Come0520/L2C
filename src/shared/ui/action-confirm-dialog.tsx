'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ActionConfirmDialogProps {
    title: string;
    description: string;
    trigger: React.ReactNode;
    action: () => Promise<void>;
    onSuccess?: () => void;
}

export function ActionConfirmDialog({
    title,
    description,
    trigger,
    action,
    onSuccess,
}: ActionConfirmDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                await action();
                setOpen(false);
                toast.success('操作成功');
                onSuccess?.();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '操作失败';
                toast.error(errorMessage);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isPending}>取消</Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={isPending}>
                        {isPending ? '提交�?..' : '确认'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
