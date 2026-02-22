'use client';

import { logger } from "@/shared/lib/logger";
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addLeadFollowupSchema } from '../schemas';
import { addLeadFollowup } from '../actions'; // Aliased export
import {
    Dialog,
    DialogContent,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Input } from '@/shared/ui/input'; // Using Input for date? or Popover. Simple Input type='datetime-local' for MVP.
import { Textarea } from '@/shared/ui/textarea';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';
// Server Action (addFollowup) 内部已使用 auth() 获取用户信息，无需从客户端传递

interface AddFollowupDialogProps {
    leadId: string;
    trigger: React.ReactNode;
}

type FormValues = z.infer<typeof addLeadFollowupSchema>;

export function AddFollowupDialog({ leadId, trigger }: AddFollowupDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm({
        resolver: zodResolver(addLeadFollowupSchema),
        defaultValues: {
            leadId,
            type: 'PHONE_CALL',
            content: '',
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                // Server Action 内部使用 auth() 获取用户信息
                await addLeadFollowup(values);
                toast.success('跟进记录添加成功');
                setOpen(false);
                form.reset();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '添加失败';
                toast.error(message);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>添加跟进记录</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>跟进方式</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择方式" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PHONE_CALL">电话</SelectItem>
                                            <SelectItem value="WECHAT_CHAT">微信</SelectItem>
                                            <SelectItem value="STORE_VISIT">到店</SelectItem>
                                            <SelectItem value="HOME_VISIT">上门</SelectItem>
                                            <SelectItem value="QUOTE_SENT">报价</SelectItem>
                                            <SelectItem value="OTHER">其他</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>跟进内容</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="输入本次跟进情况..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nextFollowupAt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>下次跟进时间</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                                field.onChange(date);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? '保存中...' : '保存记录'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
