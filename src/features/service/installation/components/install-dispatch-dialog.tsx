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
    DialogFooter
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { dispatchInstallTaskAction } from '../actions';
import { toast } from 'sonner';

const formSchema = z.object({
    installerId: z.string().min(1, '请选择安装师'),
    scheduledDate: z.string().optional(),
    scheduledTimeSlot: z.string().optional(),
    laborFee: z.string().optional(), // Input as string, convert to number
    dispatcherNotes: z.string().optional(),
});

/**
 * 安装任务指派对话框属性
 */
interface InstallDispatchDialogProps {
    /** 任务 ID */
    taskId: string;
    /** 可选安装师傅列表 */
    workers: { id: string; name: string | null }[];
    /** 自定义触发元素 */
    trigger?: React.ReactNode;
}

/**
 * 安装任务指派对话框
 * 
 * 用于管理员或调度员将安装任务分配给特定的安装师傅，并设置预约时间和预估费用。
 * 支持冲突检测（软冲突提示：重复调度或物流未就绪）。
 */
export function InstallDispatchDialog({ taskId, workers, trigger }: InstallDispatchDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            installerId: '',
            scheduledDate: '',
            scheduledTimeSlot: '',
            laborFee: '', // Use empty string for input
            dispatcherNotes: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        await executeDispatch(values, false);
    }

    async function executeDispatch(values: z.infer<typeof formSchema>, force: boolean) {
        setIsLoading(true);
        try {
            const result = await dispatchInstallTaskAction({
                id: taskId,
                installerId: values.installerId,
                scheduledDate: values.scheduledDate ? new Date(values.scheduledDate) : undefined,
                scheduledTimeSlot: values.scheduledTimeSlot,
                laborFee: values.laborFee ? parseFloat(values.laborFee) : undefined,
                dispatcherNotes: values.dispatcherNotes,
                force: force,
            });

            if (result.data?.success) {
                toast.success('指派成功');
                setOpen(false);
                form.reset();
            } else {
                const errorMsg = result.data?.error || result.error || '指派失败';
                if (errorMsg.startsWith('CONFLICT_SOFT:')) {
                    // Soft conflict - ask for confirmation
                    // Remove prefix for display
                    const message = errorMsg.replace('CONFLICT_SOFT:', '').trim();
                    if (confirm(`存在调度警告：${message}\n\n是否强制指派？`)) {
                        await executeDispatch(values, true);
                        return; // Exit current execution flow
                    }
                } else if (errorMsg.startsWith('LOGISTICS_NOT_READY:')) {
                    const message = errorMsg.replace('LOGISTICS_NOT_READY:', '').trim();
                    if (confirm(`物流状态警告：${message}\n\n是否强制指派？`)) {
                        await executeDispatch(values, true);
                        return;
                    }
                } else {
                    toast.error(errorMsg);
                }
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
                {trigger || <Button>指派安装师</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>指派安装任务</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="installerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>选择安装师</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="请选择安装师" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {workers.map((worker) => (
                                                <SelectItem key={worker.id} value={worker.id}>
                                                    {worker.name || '未命名'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="scheduledDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>预约日期</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="scheduledTimeSlot"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>预约时段</FormLabel>
                                        <FormControl>
                                            <Input placeholder="例如: 上午, 14:00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="laborFee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>预估工费 (元)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dispatcherNotes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>派单备注</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="填写注意事项..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? '正在指派...' : '确认指派'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
