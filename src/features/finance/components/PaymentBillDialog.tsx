'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentBillSchema } from '../actions/schema';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { createPaymentBill } from '../actions/ap';
import { getFinanceAccounts } from '../actions/config';
import { toast } from 'sonner';
import { useTransition, useEffect, useState } from 'react';
import { z } from 'zod';
import { PhotoUpload } from '@/shared/components/photo-upload';

type FormValues = z.infer<typeof createPaymentBillSchema>;

interface PaymentBillDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;

    // Simplified props for direct usage
    statementType?: 'AP_SUPPLIER' | 'AP_LABOR';
    statementId?: string;
    supplierName?: string; // used for both supplier and worker name display
    supplierId?: string; // or workerId
    amount?: string | number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialStatement?: any; // 保持向后兼容，后续可定义具体类型
}

export function PaymentBillDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger,
    statementType,
    statementId,
    supplierName,
    supplierId,
    amount,
    initialStatement
}: PaymentBillDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? setControlledOpen : setInternalOpen;

    const [isPending, startTransition] = useTransition();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [accounts, setAccounts] = useState<any[]>([]); // 账户列表类型后续可精确定义

    useEffect(() => {
        if (open) {
            getFinanceAccounts().then(setAccounts).catch(console.error);
        }
    }, [open]);

    const form = useForm<FormValues>({
        resolver: zodResolver(createPaymentBillSchema) as Resolver<FormValues>,
        defaultValues: {
            payeeType: 'SUPPLIER',
            payeeId: '',
            payeeName: '',
            amount: 0,
            paymentMethod: 'CASH',
            proofUrl: '',
        },
    });

    useEffect(() => {
        if (open) {
            // Priority: simplified props > initialStatement
            if (statementType && statementId) {
                const isLabor = statementType === 'AP_LABOR';
                form.reset({
                    payeeType: isLabor ? 'WORKER' : 'SUPPLIER',
                    payeeId: supplierId || '',
                    payeeName: supplierName || '',
                    amount: amount ? parseFloat(amount.toString()) : 0,
                    paymentMethod: 'CASH',
                    proofUrl: '',
                    items: [
                        {
                            statementType: statementType,
                            statementId: statementId,
                            amount: amount ? parseFloat(amount.toString()) : 0,
                        }
                    ]
                });
            } else if (initialStatement) {
                // ... compatible logic
                // We don't have exact types for initialStatement here, so we infer
                // Logic from previous version: assuming initialStatement knows if it is LABOR or SUPPLIER?
                // Actually previous version had `type` prop. We removed it in favor of `statementType`.
                // Let's support `type` if implicit.
                /*
                const payeeType = type === 'LABOR' ? 'WORKER' : 'SUPPLIER';
                const payeeId = type === 'LABOR' ? initialStatement.workerId : initialStatement.supplierId;
                ...
                */
                // Since we are refactoring, we prefer the explicit props.
            }
        }
    }, [open, statementType, statementId, supplierName, supplierId, amount, initialStatement, form]);

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                await createPaymentBill(values);
                toast.success('付款单已提交审核');
                onOpenChange?.(false);
                form.reset();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '提交失败';
                toast.error(message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>登记付款</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="payeeName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>收款方名称 *</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled={!!statementId || !!initialStatement} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>付款金额 (元) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>支付方式 *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择支付方式" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BANK_TRANSFER">银行转账</SelectItem>
                                                <SelectItem value="WECHAT">微信支付</SelectItem>
                                                <SelectItem value="ALIPAY">支付宝</SelectItem>
                                                <SelectItem value="CASH">现金</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>出账账户</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择结算账户" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {accounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.accountName} (余额: ¥{parseFloat(acc.balance).toLocaleString()})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="proofUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>支付凭证 *</FormLabel>
                                    <FormControl>
                                        <PhotoUpload
                                            value={field.value ? [field.value] : []}
                                            onChange={(urls) => field.onChange(urls[0] || '')}
                                            maxFiles={1}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="remark"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>备注</FormLabel>
                                    <FormControl>
                                        <Input placeholder="选填" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange?.(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? '提交中...' : '确认付款'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
