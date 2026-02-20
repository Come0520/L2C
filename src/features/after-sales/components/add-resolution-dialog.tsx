'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateStatusSchema } from '../actions/schemas';
import { updateTicketStatus } from '../actions/ticket';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
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
import { Textarea } from '@/shared/ui/textarea';
import { toast } from '@/shared/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

interface AddResolutionDialogProps {
    ticketId: string;
    currentStatus: string;
    onSuccess?: () => void;
}

export function AddResolutionDialog({ ticketId, currentStatus, onSuccess }: AddResolutionDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm<z.infer<typeof updateStatusSchema>>({
        resolver: zodResolver(updateStatusSchema),
        defaultValues: {
            ticketId,
            status: 'PROCESSING',
            resolution: '',
        },
    });

    async function onSubmit(values: z.infer<typeof updateStatusSchema>) {
        setIsPending(true);
        try {
            const result = await updateTicketStatus(values);
            if (result.success) {
                toast({ title: '更新成功', description: '工单状态及处理方案已更新' });
                setOpen(false);
                onSuccess?.();
            } else {
                toast({ title: '更新失败', description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: '错误', description: '系统异常，请稍后再试', variant: 'destructive' });
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    录入处理方案
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>完善处理方案</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>流转状态</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择新状态" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="INVESTIGATING">核实中 (INVESTIGATING)</SelectItem>
                                            <SelectItem value="PROCESSING">处理中 (PROCESSING)</SelectItem>
                                            <SelectItem value="CLOSED">已结案 (CLOSED)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="resolution"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>处理方案/结果</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="请输入详细的处理过程或最终解决方案..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>取消</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                确认提交
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
