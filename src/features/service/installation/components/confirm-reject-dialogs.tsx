'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { confirmInstallationAction, rejectInstallationAction } from '../actions';
import { toast } from 'sonner';

// --- Confirm Dialog ---

const confirmSchema = z.object({
    actualLaborFee: z.string().min(1, "实际工费必填"),
    adjustmentReason: z.string().optional(),
    rating: z.string().optional(), // select string '1'-'5'
    ratingComment: z.string().optional(),
});

interface ConfirmInstallDialogProps {
    taskId: string;
    estimatedFee?: number;
    trigger?: React.ReactNode;
}

/**
 * 确认验收安装对话框组件
 * 销售或管理人员点击此对话框，输入实际工费并完成评价以结束安装任务
 * 
 * @param {string} taskId - 任务 ID
 * @param {number} estimatedFee - 预估工费（用于初始化实际工费）
 * @param {React.ReactNode} trigger - 自定义触发元素
 */
export function ConfirmInstallDialog({ taskId, estimatedFee, trigger }: ConfirmInstallDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof confirmSchema>>({
        resolver: zodResolver(confirmSchema),
        defaultValues: {
            actualLaborFee: estimatedFee ? estimatedFee.toString() : '',
            adjustmentReason: '',
            rating: '5',
            ratingComment: '',
        },
    });

    async function onSubmit(values: z.infer<typeof confirmSchema>) {
        setIsLoading(true);
        try {
            const result = await confirmInstallationAction({
                taskId,
                actualLaborFee: parseFloat(values.actualLaborFee),
                adjustmentReason: values.adjustmentReason,
                rating: values.rating ? parseInt(values.rating) : undefined,
                ratingComment: values.ratingComment,
            });

            if (result.data?.success) {
                toast.success('验收成功');
                setOpen(false);
            } else {
                toast.error(result.data?.error || result.error || '验收失败');
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
                {trigger || <Button variant="default">确认验收</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>确认验收安装</DialogTitle>
                    <DialogDescription>确认各项安装结果无误后，将完成此任务并生成结算。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="actualLaborFee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>实际结算工费 (元)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="adjustmentReason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>费用调整原因 (如有)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例如: 增加额外钻孔..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户评价 (1-5 星)</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" max="5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ratingComment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户评价内容</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="客户反馈..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? '提交中...' : '确认通过'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- Reject Dialog ---

const rejectSchema = z.object({
    reason: z.string().min(1, "必须填写驳回原因"),
});

interface RejectInstallDialogProps {
    taskId: string;
    trigger?: React.ReactNode;
}

/**
 * 驳回安装任务对话框组件
 * 用于在验收不通过时，填写原因并将任务退回给师傅整改
 * 
 * @param {string} taskId - 任务 ID
 * @param {React.ReactNode} trigger - 自定义触发元素
 */
export function RejectInstallDialog({ taskId, trigger }: RejectInstallDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof rejectSchema>>({
        resolver: zodResolver(rejectSchema),
        defaultValues: {
            reason: '',
        },
    });

    async function onSubmit(values: z.infer<typeof rejectSchema>) {
        setIsLoading(true);
        try {
            const result = await rejectInstallationAction({
                id: taskId,
                reason: values.reason,
            });

            if (result.data?.success) {
                toast.success('已驳回任务');
                setOpen(false);
                form.reset();
            } else {
                toast.error(result.data?.error || result.error || '驳回失败');
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
                {trigger || <Button variant="destructive">驳回整改</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>驳回安装验收</DialogTitle>
                    <DialogDescription>任务将退回给师傅重新处理。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>驳回原因</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="例如: 某处安装不平整，需返工..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                            <Button type="submit" variant="destructive" disabled={isLoading}>
                                {isLoading ? '提交中...' : '确认驳回'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
