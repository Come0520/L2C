'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { useToast } from '@/shared/components/ui/use-toast';
import { createAfterSalesTicket } from '../actions';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const createTicketSchema = z.object({
    orderId: z.string().uuid("请选择关联订单"),
    type: z.string().min(1, "请选择售后类型"),
    description: z.string().min(1, "问题描述不能为空"),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    assignedTo: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof createTicketSchema>;

export function CreateTicketForm() {
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            orderId: '',
            type: 'REPAIR',
            priority: 'MEDIUM',
            description: '',
        },
    });

    const onSubmit = async (values: FormValues) => {
        const result = await createAfterSalesTicket(values);

        if (result.success) {
            toast({ title: '创建成功', description: result.message });
            router.push(`/after-sales/${result.data?.id}`);
        } else {
            toast({
                title: '创建失败',
                description: result.error || result.message,
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/after-sales">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">新建售后工单</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 border p-6 rounded-lg bg-card shadow-sm">
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
                                                <SelectValue placeholder="选择类型" />
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
                                                <SelectValue placeholder="选择优先级" />
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
                                    <Textarea {...field} placeholder="请详细描述售后问题、原因及初步处理建议..." rows={5} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end gap-4">
                        <Link href="/after-sales">
                            <Button variant="outline" type="button">取消</Button>
                        </Link>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            创建工单
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
