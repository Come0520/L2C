'use client';

import { logger } from "@/shared/lib/logger";
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentOrderSchema } from '../actions/schema';
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
import { createPaymentOrder } from '@/features/finance/actions/ar';
import { getFinanceAccounts } from '@/features/finance/actions/config';
import { toast } from 'sonner';
import { useTransition, useEffect, useState } from 'react';
import { z } from 'zod';
import { PhotoUpload } from '@/shared/components/photo-upload';
import type { InferSelectModel } from 'drizzle-orm';
import type { financeAccounts } from '@/shared/api/schema';

/** 财务账户行类型 */
type FinanceAccount = InferSelectModel<typeof financeAccounts>;

/** 初始对账单数据（从外部传入） */
interface InitialStatementData {
    customerId: string;
    customerName: string;
    customer?: { phone?: string };
    pendingAmount: string;
    orderId: string;
}

type FormValues = z.infer<typeof createPaymentOrderSchema>;

interface PaymentOrderDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;

    // Simplified props
    orderId?: string;
    customerId?: string;
    customerName?: string;
    amount?: string | number;

    initialStatement?: InitialStatementData;
}

export function PaymentOrderDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger,
    orderId,
    customerId,
    customerName,
    amount,
    initialStatement
}: PaymentOrderDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? setControlledOpen : setInternalOpen;

    const [isPending, startTransition] = useTransition();

    const [accounts, setAccounts] = useState<FinanceAccount[]>([]);

    useEffect(() => {
        if (open) {
            getFinanceAccounts().then(setAccounts).catch(logger.error);
        }
    }, [open]);

    const form = useForm<FormValues>({
        resolver: zodResolver(createPaymentOrderSchema) as Resolver<FormValues>,
        defaultValues: {
            customerName: '',
            customerPhone: '',
            type: 'NORMAL',
            totalAmount: 0,
            paymentMethod: 'WECHAT',
            receivedAt: new Date(),
            proofUrl: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (orderId) {
                form.reset({
                    customerId: customerId || '',
                    customerName: customerName || '',
                    customerPhone: '', // 详情页可能没传，需要补或者让用户填
                    type: 'NORMAL',
                    totalAmount: amount ? parseFloat(amount.toString()) : 0,
                    paymentMethod: 'WECHAT',
                    receivedAt: new Date(),
                    proofUrl: '',
                    items: [
                        {
                            orderId: orderId,
                            amount: amount ? parseFloat(amount.toString()) : 0,
                        }
                    ]
                });
            } else if (initialStatement) {
                form.reset({
                    customerId: initialStatement.customerId,
                    customerName: initialStatement.customerName,
                    customerPhone: initialStatement.customer?.phone || '',
                    type: 'NORMAL',
                    totalAmount: parseFloat(initialStatement.pendingAmount),
                    paymentMethod: 'WECHAT',
                    receivedAt: new Date(),
                    proofUrl: '',
                    items: [
                        {
                            orderId: initialStatement.orderId,
                            amount: parseFloat(initialStatement.pendingAmount),
                        }
                    ]
                });
            }
        }
    }, [open, orderId, customerId, customerName, amount, initialStatement, form]);

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                await createPaymentOrder(values);
                toast.success('收款单已提交审核');
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
                    <DialogTitle>登记收款</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>客户姓名 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="输入姓名" {...field} disabled={!!orderId || !!initialStatement} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="customerPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>手机号 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="输入手机号" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="totalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>收款金额 (元) *</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                <SelectItem value="WECHAT">微信支付</SelectItem>
                                                <SelectItem value="ALIPAY">支付宝</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">银行转账</SelectItem>
                                                <SelectItem value="CASH">现金</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="accountId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>结算账户</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择入账账户" />
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
                            <FormField
                                control={form.control}
                                name="receivedAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>收款日期</FormLabel>
                                        <FormControl>
                                            <Input type="date" value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} onChange={e => field.onChange(new Date(e.target.value))} />
                                        </FormControl>
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
                                {isPending ? '提交中...' : '确认收款'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
