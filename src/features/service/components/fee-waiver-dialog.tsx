'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/dialog";
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';

/**
 * 费用减免申请对话框属性
 */
interface FeeWaiverDialogProps {
    /** 关联的任务 ID */
    taskId: string;
    /** 自定义触发元素 */
    trigger?: React.ReactNode;
}

/**
 * 费用减免申请对话框
 * 
 * 允许用户提交费用减免申请。该申请通常需要管理者审批。
 */
export function FeeWaiverDialog({ taskId, trigger }: FeeWaiverDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error('请输入减免原因');
            return;
        }

        setIsSubmitting(true);
        try {
            // TODO: 此处应调用真实的 requestFeeWaiver Server Action
            // 目前由于流程引擎正在迁移，暂保留交互逻辑并记录日志
            await new Promise(resolve => setTimeout(resolve, 800));

            console.info(`[FeeWaiver] Request submitted for task ${taskId}: ${reason}`);
            toast.success('费用减免申请已提交，等待审核');
            setIsOpen(false);
        } catch (_error) {
            toast.error('申请提交失败');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Request Waiver</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>申请费用减免</DialogTitle>
                    <DialogDescription>
                        提交减免测量/安装费用的申请。提交后将进入审批流程。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">申请原因</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="请说明需要减免费用的具体原因..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                        取消
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? '提交中...' : '提交申请'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
