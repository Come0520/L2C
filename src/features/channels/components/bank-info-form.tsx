'use client';

import { UseFormReturn } from 'react-hook-form';
import { ChannelInput } from '../actions/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

interface BankInfoFormProps {
    form: UseFormReturn<ChannelInput>;
}

export function BankInfoForm({ form }: BankInfoFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>银行账户信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="bankInfo.bankName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>开户银行</FormLabel>
                            <FormControl>
                                <Input placeholder="例如: 中国工商银行" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bankInfo.bankBranch"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>开户支行 (选填)</FormLabel>
                            <FormControl>
                                <Input placeholder="例如: 上海徐汇支行" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bankInfo.accountName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>账户名称</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入账户名称" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bankInfo.accountNumber"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>银行账号</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入银行账号" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>
    );
}
