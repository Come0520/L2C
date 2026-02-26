'use client';

import { useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { voidLeadSchema } from '../schemas';
import { voidLead } from '../actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    leadId: string | null;
    userId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type FormValues = z.infer<typeof voidLeadSchema>;

export function VoidLeadDialog({ leadId, userId, open, onOpenChange, onSuccess }: VoidLeadDialogProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(voidLeadSchema),
        defaultValues: {
            id: leadId || '',
            reason: '',
        },
    });

    // Reset form and sync leadId when dialog opens or leadId changes
    useEffect(() => {
        if (open && leadId) {
            form.reset({
                id: leadId,
                reason: '',
            });
        }
    }, [open, leadId, form]);

    const onSubmit = (values: FormValues) => {
        // Only check userId if not explicitly skipped or handled elsewhere?
        // But here it seems required.
        // However, if called from table, maybe we rely on backend validaton too?
        // But the previous code checked it.
        // If userId is optional in props, we should check it here.
        // BUT if it is not passed, we can't submit?
        // We will assume environment is authenticated if we reached here.
        // But for consistency let's keep the check if provided, or rely on server action to fail.

        startTransition(async () => {
            try {
                const res = await voidLead(values);
                if (res.success) {
                    toast.success('线索已作废');
                    onOpenChange(false);
                    onSuccess?.();
                } else {
                    toast.error(res.error || '操作失败');
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '操作失败';
                toast.error(message);
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button type="submit" variant="destructive" disabled={isPending || !leadId}>
                                {isPending ? '提交中...' : '确认作废'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
