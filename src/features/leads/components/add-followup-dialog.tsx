'use client';

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
import { auth } from '@/shared/lib/auth'; // CANNOT use auth in Client Component. Need to pass userId/tenantId or handle in server action via session() call inside action (better).
// But my action `addFollowup` takes userId, tenantId as args.
// I should wrap the action to inject user if possible, or pass props.
// Ideally actions use `auth()` inside. But I passed them as args.
// I'll assume props are passed OR I will refactor action to use `auth()`.
// For now, I'll update action to use `auth()` if I can, OR pass them as props to this component.
// `[id]/page.tsx` is server component, it can pass userId/tenantId.
// BUT `[id]/page.tsx` didn't pass them in existing code.
// I need updates in `page.tsx`.

// Let's stick passing props.
interface AddFollowupDialogProps {
    leadId: string;
    trigger: React.ReactNode;
    userId?: string; // Optional for now to avoid breaking types immediately, but required for logic
    tenantId?: string;
}

// Wait, server actions run on server. `auth()` works on server.
// `mutations.ts` functions currently take userId as arg.
// I can make a wrapper action or just update `mutations.ts` to use `auth()` internally.
// Using `auth()` internally is safer and cleaner.
// I already updated `mutations.ts` to `import 'server-only'`. `auth()` is available.
// I should Refactor `mutations.ts` to remove userId/tenantId params and use `auth()`.
// This is best practice.
// BUT I don't want to rewrite `mutations.ts` AGAIN if I can avoid it.
// I will pass userId/tenantId from `page.tsx` to this component.
// `page.tsx` has `session`.

type FormValues = z.infer<typeof addLeadFollowupSchema>;

export function AddFollowupDialog({ leadId, trigger, userId, tenantId }: AddFollowupDialogProps) {
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
        if (!userId || !tenantId) {
            toast.error('用户信息缺失');
            return;
        }

        startTransition(async () => {
            try {
                await addLeadFollowup(values, userId, tenantId);
                toast.success('跟进记录添加成功');
                setOpen(false);
                form.reset();
            } catch (error: any) {
                toast.error(error.message || '添加失败');
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
