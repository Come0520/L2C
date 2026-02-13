'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFinanceAccountSchema } from '../actions/schema';
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
import { Switch } from '@/shared/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { createFinanceAccount, updateFinanceAccount } from '@/features/finance/actions/config';
import { toast } from 'sonner';
import { useTransition, useEffect } from 'react';
import { z } from 'zod';

type FormValues = z.infer<typeof createFinanceAccountSchema>;

interface AccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
     
    initialData?: any; // 账户数据结构复杂，后续可定义具体类型
}

export function AccountDialog({ open, onOpenChange, initialData }: AccountDialogProps) {
    const [isPending, startTransition] = useTransition();
    const isEdit = !!initialData;

    const form = useForm({
        resolver: zodResolver(createFinanceAccountSchema),
        defaultValues: {
            accountNo: '',
            accountName: '',
            accountType: 'BANK',
            holderName: '',
            isDefault: false,
        },
    });

    useEffect(() => {
        if (open && initialData) {
            form.reset({
                accountNo: initialData.accountNo,
                accountName: initialData.accountName,
                accountType: initialData.accountType,
                accountNumber: initialData.accountNumber || '',
                bankName: initialData.bankName || '',
                branchName: initialData.branchName || '',
                holderName: initialData.holderName,
                isDefault: initialData.isDefault,
                remark: initialData.remark || '',
            });
        } else if (open && !initialData) {
            form.reset({
                accountNo: `ACC-${Date.now().toString().slice(-6)}`,
                accountName: '',
                accountType: 'BANK',
                holderName: '',
                isDefault: false,
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            try {
                if (isEdit) {
                    await updateFinanceAccount({ id: initialData.id, ...values });
                    toast.success('账户更新成功');
                } else {
                    await createFinanceAccount(values);
                    toast.success('账户创建成功');
                }
                onOpenChange(false);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '操作失败';
                toast.error(message);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '编辑财务账户' : '添加财务账户'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="accountName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>账户名称 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="例如：招行基本户" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>账户类型</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="选择类型" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BANK">银行账户</SelectItem>
                                                <SelectItem value="WECHAT">微信支付</SelectItem>
                                                <SelectItem value="ALIPAY">支付宝</SelectItem>
                                                <SelectItem value="CASH">现金账户</SelectItem>
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
                                name="accountNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>账户编号 *</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="holderName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>持有人 *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="姓名或公司名" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>卡号/账号</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入银行卡号或三方账号" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {form.watch('accountType') === 'BANK' && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>开户行</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：中国银行" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="branchName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>支行名称</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：北京分行xx支行" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="isDefault"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">设置为默认账户</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? '保存中...' : '提交'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
