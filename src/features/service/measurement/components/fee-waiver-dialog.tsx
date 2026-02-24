'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { feeWaiverSchema } from '../schemas';
import { requestFeeWaiver } from '../actions/mutations';
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';

/**
 * 费用豁免申请对话框属性
 */
interface FeeWaiverDialogProps {
    /** 测量任务 ID */
    taskId: string;
    /** 自定义触发元素 */
    trigger?: React.ReactNode;
}

/**
 * 测量费用豁免申请对话框
 * 
 * 用于发起免收测量费的审批申请。审批通过后，任务会自动进入后续状态。
 */
export function FeeWaiverDialog({ taskId, trigger }: FeeWaiverDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof feeWaiverSchema>>({
        resolver: zodResolver(feeWaiverSchema),
        defaultValues: {
            taskId,
            reason: '',
        },
    });

    async function onSubmit(values: z.infer<typeof feeWaiverSchema>) {
        startTransition(async () => {
            const result = await requestFeeWaiver(values);
            if (result?.success) {
                toast.success('申请提交成功', { description: '已进入审批流程' });
                setOpen(false);
                form.reset();
            } else {
                toast.error('申请提交失败', { description: (result && 'error' in result ? result.error : '未知错误') as string });
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">申请费用豁免</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>申请测量费豁免</DialogTitle>
                    <DialogDescription>
                        发起免收测量费的审批申请。审批通过后，任务将自动进入待分配状态。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>豁免原因</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="请输入申请豁免的具体原因..." className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? '提交中...' : '提交申请'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
