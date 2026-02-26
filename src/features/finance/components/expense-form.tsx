// @ts-nocheck
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { createExpenseSchema } from '../schemas';
import { createExpenseRecord } from '../actions/expense-actions';

type FormValues = z.infer<typeof createExpenseSchema>;

interface ExpenseFormProps {
  accounts: { id: string; name: string; code: string }[];
  onSuccess?: () => void;
}

export function ExpenseForm({ accounts, onSuccess }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<any>({
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: {
      accountId: '',
      amount: 0,
      expenseDate: new Date(),
      description: '',
      createVoucher: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const res: any = await createExpenseRecord(values);

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      const data: any = res;
      if (data?.success) {
        toast.success('费用记录已保存' + (data.voucherId ? '，已自动生成凭证' : ''));
        form.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || '系统错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control as any}
            name="accountId"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>费用科目</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择费用科目" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="amount"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>发生金额</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-2 left-3">¥</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="pl-7"
                      placeholder="0.00"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="expenseDate"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>发生日期</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : String(field.value)
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2">
            <FormField
              control={form.control as any}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>费用摘要</FormLabel>
                  <FormControl>
                    <Input placeholder="请填写费用的简要说明" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-muted/30 rounded-md border p-4 md:col-span-2">
            <FormField
              control={form.control as any}
              name="createVoucher"
              render={({ field }: any) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">自动生成凭证</FormLabel>
                    <FormDescription>
                      开启后，系统在保存费用的同时，会根据自动凭证模板同步生成记账凭证
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : '保存记录'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
