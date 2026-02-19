import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Textarea } from '@/shared/ui/textarea';

interface RejectQuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    loading?: boolean;
}

export function RejectQuoteDialog({
    open,
    onOpenChange,
    onConfirm,
    loading = false,
}: RejectQuoteDialogProps) {
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>拒绝报价单</AlertDialogTitle>
                    <AlertDialogDescription>
                        请填写拒绝原因，此操作将通知销售人员。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="请输入拒绝原因..."
                        className="h-24"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault(); // 阻止自动关闭，等待 confirm 逻辑
                            handleConfirm();
                        }}
                        disabled={!reason.trim() || loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? '提交中...' : '确认拒绝'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
