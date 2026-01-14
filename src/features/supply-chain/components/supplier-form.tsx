'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupplierSchema, updateSupplierSchema } from '../schemas';

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
import { Textarea } from '@/shared/ui/textarea';
import { Loader2 } from 'lucide-react';

type SupplierFormValues = {
    id?: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    paymentPeriod: 'CASH' | 'MONTHLY';
    address?: string;
    remark?: string;
};

interface SupplierFormProps {
    initialData?: SupplierFormValues;
    onSubmit: (values: SupplierFormValues) => Promise<void>;
    isLoading?: boolean;
}

export function SupplierForm({ initialData, onSubmit, isLoading }: SupplierFormProps) {
    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(initialData?.id ? updateSupplierSchema : createSupplierSchema as any), // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: initialData || {
            name: '',
            contactPerson: '',
            phone: '',
            paymentPeriod: 'CASH',
            address: '',
            remark: '',
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>供应商名称</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入供应商名称" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>联系人</FormLabel>
                                <FormControl>
                                    <Input placeholder="输入联系人姓名" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>联系电话</FormLabel>
                                <FormControl>
                                    <Input placeholder="输入电话号码" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="paymentPeriod"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>结算方式</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择结算方式" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="CASH">现结</SelectItem>
                                    <SelectItem value="MONTHLY">月结</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>联系地址</FormLabel>
                            <FormControl>
                                <Textarea placeholder="输入详细地址" {...field} />
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
                                <Textarea placeholder="输入备注信息" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading} className="w-32">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData?.id ? '更新' : '创建'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
