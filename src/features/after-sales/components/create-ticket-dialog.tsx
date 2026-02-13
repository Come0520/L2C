'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { createAfterSalesTicket } from '../actions';
import { Loader2 } from 'lucide-react';

const createTicketSchema = z.object({
    orderId: z.string().uuid("请选择关联订单"),
    type: z.string().min(1, "请选择售后类型"),
    description: z.string().min(1, "问题描述不能为空"),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    assignedTo: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof createTicketSchema>;

interface CreateTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId?: string;
    onSuccess?: () => void;
}

export function CreateTicketDialog({
    open,
    onOpenChange,
    orderId,
    onSuccess,
}: CreateTicketDialogProps) {


    const form = useForm<FormValues>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            orderId: orderId || '',
            type: 'REPAIR',
            priority: 'MEDIUM',
            description: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        const result = await createAfterSalesTicket(values);

        if (result.data?.success) {
            toast.success('创建成功', { description: result.data.message });
            onOpenChange(false);
            form.reset();
            onSuccess?.();
        } else {
            toast.error('创建失败', {
                description: result.error || result.data?.message,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>创建售后工单</DialogTitle>
                    <DialogDescription>
                        填写售后申请详情。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="orderId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>关联订单 ID</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="输入订单 ID (在此应有选择器)" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>售后类型</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="类型" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="REPAIR">维修</SelectItem>
                                                <SelectItem value="RETURN">退货</SelectItem>
                                                <SelectItem value="EXCHANGE">换货</SelectItem>
                                                <SelectItem value="COMPLAINT">投诉</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>优先级</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="优先级" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="HIGH">高</SelectItem>
                                                <SelectItem value="MEDIUM">中</SelectItem>
                                                <SelectItem value="LOW">低</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>详细描述</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="详细描述售后问题..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                提交
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
