'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { voidLeadSchema } from '../schemas';
import { voidLead } from '../actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
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
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';

interface VoidLeadDialogProps {
    leadId: string;
    trigger: React.ReactNode;
    userId?: string; // Optional for safety but required
}

type FormValues = z.infer<typeof voidLeadSchema>;

export function VoidLeadDialog({ leadId, trigger, userId }: VoidLeadDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(voidLeadSchema),
        defaultValues: {
            id: leadId,
            reason: '',
        },
    });

    const onSubmit = (values: FormValues) => {
        if (!userId) {
            toast.error('用户未登录');
            return;
        }

        startTransition(async () => {
            try {
                await voidLead(values, userId);
                toast.success('线索已作废');
                setOpen(false);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '操作失败';
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
                    <DialogTitle>作废线索</DialogTitle>
                    <DialogDescription>
                        作废后线索将无法跟进，请填写作废原因。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>作废原因</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="输入原因..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4 space-x-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                取消
                            </Button>
                            <Button type="submit" variant="destructive" disabled={isPending}>
                                {isPending ? '提交中...' : '确认作废'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
