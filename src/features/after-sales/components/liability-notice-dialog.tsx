'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/shared/components/ui/dialog';
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
import { createLiabilityNotice } from '../actions';
import { useToast } from '@/shared/components/ui/use-toast';
import { liablePartyTypeEnum, liabilityReasonCategoryEnum } from '@/shared/api/schema/enums';

const REASON_CATEGORY_LABELS: Record<string, string> = {
    'PRODUCTION_QUALITY': '生产质量',
    'CONSTRUCTION_ERROR': '施工失误',
    'DATA_ERROR': '数据错误',
    'SALES_ERROR': '销售失误',
    'LOGISTICS_ISSUE': '物流问题',
    'CUSTOMER_REASON': '客户/人为原因',
};
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    liablePartyType: z.enum(liablePartyTypeEnum.enumValues),
    reason: z.string().min(1, "定责原因不能为空"),
    liabilityReasonCategory: z.enum(liabilityReasonCategoryEnum.enumValues).optional(), // Added
    amount: z.coerce.number().min(0, "金额必须大于等于0"),
    // TODO: Add liablePartyId selection logic if we have the list of suppliers/workers
});

type FormValues = z.infer<typeof formSchema>;

interface LiabilityNoticeDialogProps {
    afterSalesId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function LiabilityNoticeDialog({ afterSalesId, onSuccess, trigger }: LiabilityNoticeDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reason: '',
            amount: 0,
        },
    });

    const onSubmit = async (values: FormValues) => {
        const result = await createLiabilityNotice({
            ...values,
            afterSalesId,
            liablePartyId: undefined, // TODO: Implement selection
        });

        if (result.error) {
            toast({ title: '创建失败', description: result.error, variant: 'destructive' });
            return;
        }

        if (result.data?.success) {
            toast({ title: '创建成功', description: result.data.message });
            setOpen(false);
            if (onSuccess) onSuccess();
        } else {
            toast({ title: '创建失败', description: result.data?.message || '未知错误', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">新建定责单</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>新建定责单</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="liablePartyType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>责任方类型</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择责任方类型" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {liablePartyTypeEnum.enumValues.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
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
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>定责金额</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>定责原因</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="liabilityReasonCategory"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>原因分类</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="选择原因分类" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {liabilityReasonCategoryEnum.enumValues.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {REASON_CATEGORY_LABELS[type] || type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
