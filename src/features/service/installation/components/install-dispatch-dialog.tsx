'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
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
import { assignInstallWorker } from '../actions';
import { toast } from 'sonner';


const dispatchSchema = z.object({
    workerId: z.string().min(1, "请选择安装师傅"),
    scheduledAt: z.string().min(1, "请选择预约时间"),
    laborFee: z.string().optional(),
});

type DispatchFormValues = z.infer<typeof dispatchSchema>;

interface DispatchDialogProps {
    taskId: string;
    workers: { id: string; name: string }[];
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function InstallDispatchDialog({ taskId, workers, trigger, onSuccess }: DispatchDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<DispatchFormValues>({
        resolver: zodResolver(dispatchSchema),
        defaultValues: {
            workerId: '',
            scheduledAt: '',
            laborFee: '',
        }
    });

    const onSubmit = async (data: DispatchFormValues) => {
        setLoading(true);
        try {
            await assignInstallWorker({
                taskId,
                workerId: data.workerId,
                scheduledDate: data.scheduledAt,
                laborFee: data.laborFee ? Number(data.laborFee) : undefined
            });
            toast.success('指派成功');
            setOpen(false);
            onSuccess?.();
        } catch (error) {
            toast.error('操作失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>指派安装</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>指派安装师傅</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="workerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>选择师傅</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择人员" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {workers.map(w => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="scheduledAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>预约时间</FormLabel>
                                    <FormControl>
                                        <Input type="datetime-local" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="laborFee"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>预估工费 (�?</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
                            <Button type="submit" variant="success" isLoading={loading}>
                                确认指派
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
