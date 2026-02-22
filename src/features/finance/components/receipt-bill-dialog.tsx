'use client';

import { logger } from "@/shared/lib/logger";
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { createAndSubmitReceipt } from '@/features/finance/actions/receipt';
import { getFinanceAccounts } from '@/features/finance/actions/config';
import { toast } from 'sonner';
import { useTransition, useEffect, useState } from 'react';
import { z } from 'zod';
import { PhotoUpload } from '@/shared/components/photo-upload';

// 使用与后端匹配的 Schema 逻辑（简化版，或引用原 schema）
const createReceiptSchema = z.object({
    customerId: z.string().uuid().optional(),
    customerName: z.string().min(1, '客户姓名不能为空'),
    customerPhone: z.string().min(1, '客户电话不能为空'),
    type: z.enum(['PREPAID', 'NORMAL']).default('NORMAL'),
    totalAmount: z.number().min(0.01, '收款金额必须大于0'),
    paymentMethod: z.string().min(1, '支付方式不能为空'),
    accountId: z.string().uuid().optional(),
    proofUrl: z.string().min(1, '支付凭证不能为空'),
    receivedAt: z.coerce.date(),
    remark: z.string().optional(),
    items: z.array(z.object({
        orderId: z.string().uuid(),
        amount: z.number().min(0.01),
        statementId: z.string().uuid().optional(),
    })).optional(),
});

type FormValues = z.infer<typeof createReceiptSchema>;

import { ARStatementWithRelations, FinanceAccount } from '../types';

interface ReceiptBillDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    orderId?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    amount?: string | number;

    initialStatement?: ARStatementWithRelations | null;
}

export function ReceiptBillDialog({
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    trigger,
    orderId,
    customerId,
    customerName,
    customerPhone,
    amount,
    initialStatement
}: ReceiptBillDialogProps) {
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
        resolver: zodResolver(createReceiptSchema) as Resolver<FormValues>,
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

    const initialStatementId = initialStatement?.id;
    const initialStatementPendingAmount = initialStatement?.pendingAmount;
    const initialStatementCustomerId = initialStatement?.customerId;
    const initialStatementCustomerName = initialStatement?.customerName;
    const initialStatementCustomerPhone = initialStatement?.customer?.phone;
    const initialStatementOrderId = initialStatement?.orderId;
    const initialStatementOrderNo = initialStatement?.order?.orderNo;

    useEffect(() => {
        if (open) {
            if (orderId) {
                form.reset({
                    customerId: customerId || '',
                    customerName: customerName || '',
                    customerPhone: customerPhone || '',
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
                    customerId: initialStatementCustomerId || '',
                    customerName: initialStatementCustomerName || '',
                    customerPhone: initialStatementCustomerPhone || '',
                    type: 'NORMAL',
                    totalAmount: initialStatementPendingAmount ? parseFloat(initialStatementPendingAmount) : 0,
                    paymentMethod: 'WECHAT',
                    receivedAt: new Date(),
                    proofUrl: '',
                    items: [
                        {
                            orderId: initialStatementOrderId || '',
                            amount: initialStatementPendingAmount ? parseFloat(initialStatementPendingAmount) : 0,
                            statementId: initialStatementId,
                        }
                    ]
                });
            }
        }
    }, [
        open, orderId, customerId, customerName, customerPhone, amount, form,
        initialStatement, initialStatementId, initialStatementPendingAmount,
        initialStatementCustomerId, initialStatementCustomerName,
        initialStatementCustomerPhone, initialStatementOrderId
    ]);

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                // 转换为 Action 期望的类型 (CreateReceiptBillData)
                const actionData = {
                    ...values,
                    totalAmount: values.totalAmount.toString(),
                    items: values.items?.map(item => ({
                        orderId: item.orderId,
                        orderNo: initialStatementOrderId === item.orderId ? (initialStatementOrderNo || 'UNKNOWN') : 'UNKNOWN',
                        amount: item.amount.toString(),
                        statementId: item.statementId,
                    }))
                };

                const result = await createAndSubmitReceipt(
                    actionData as Parameters<typeof createAndSubmitReceipt>[0]
                );
                const res = result as { success?: boolean; error?: string; data?: unknown; serverError?: string };
                if (res.success || res.data) {
                    toast.success('收款单已提交审批');
                    onOpenChange?.(false);
                    form.reset();
                } else {
                    toast.error(res.error || res.serverError || '提交失败');
                }
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
                    <DialogTitle>登记收款 (需审批)</DialogTitle>
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
                                {isPending ? '提交审批中...' : '提交审批'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
