'use client';

import { logger } from "@/shared/lib/logger";
import React, { useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Textarea } from '@/shared/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { addLeadFollowupSchema, followUpTypeEnum } from '../../schemas';
import { addFollowup } from '../../actions/mutations';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import { z } from 'zod';

interface FollowUpDialogProps {
    leadId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    initialType?: z.infer<typeof followUpTypeEnum>;
}

const FOLLOWUP_TYPES = [
    { value: 'PHONE_CALL', label: '电话跟进' },
    { value: 'WECHAT_CHAT', label: '微信沟通' },
    { value: 'STORE_VISIT', label: '到店拜访' },
    { value: 'HOME_VISIT', label: '上门量房/拜访' },
    { value: 'OTHER', label: '其他' },
];

// 表单 Schema，不包含 leadId，因为它是通过 props 传递的
const formSchema = addLeadFollowupSchema.omit({ leadId: true }).extend({
    type: followUpTypeEnum
});
type FormValues = z.infer<typeof formSchema>;

export function FollowUpDialog({
    leadId,
    open,
    onOpenChange,
    onSuccess,
    initialType
}: FollowUpDialogProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: initialType || 'PHONE_CALL',
            content: '',
            nextFollowupAt: undefined,
        },
    });

    // 当弹窗打开且传入了初始类型时，设置表单默认值
    useEffect(() => {
        if (open && initialType) {
            form.setValue('type', initialType);
        }
    }, [open, initialType, form]);

    // Reset form when dialog closes
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset();
        }
        onOpenChange(newOpen);
    };

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                await addFollowup({ ...values, leadId });
                toast.success('跟进记录已添加');
                onSuccess?.();
                handleOpenChange(false);
            } catch (error) {
                logger.error('Add followup error:', error);
                const message = error instanceof Error ? error.message : '添加失败';
                toast.error(message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isPending}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择跟进方式" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {FOLLOWUP_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
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
                                        <Textarea
                                            placeholder="记录本次跟进的详情..."
                                            className="min-h-[100px]"
                                            {...field}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nextFollowupAt"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>下次跟进时间 (可选)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                                field.onChange(date);
                                            }}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                                取消
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存记录
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
