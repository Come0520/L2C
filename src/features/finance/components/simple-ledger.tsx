// @ts-nocheck
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { z } from 'zod';
import { PlusCircle } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

import { addSimpleTransaction } from '../actions/simple-mode-actions';
import { SimpleTransactionSchema } from '../types/simple-transaction';

interface TransactionRow {
  id: string;
  date: string;
  type: '收入' | '支出';
  amount: number;
  description: string | null;
}

interface SimpleLedgerProps {
  initialData: TransactionRow[];
}

export function SimpleLedgerClient({ initialData }: SimpleLedgerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SimpleTransactionSchema>>({
    resolver: zodResolver(SimpleTransactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      amount: 0,
      expenseDate: new Date(),
      description: '',
    },
  });

  const onSubmit = (data: z.infer<typeof SimpleTransactionSchema>) => {
    startTransition(async () => {
      try {
        const res = await addSimpleTransaction(data);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success('流水已记录');
          setIsOpen(false);
          form.reset();
        }
      } catch (_e) {
        toast.error('网络请求异常');
      }
    });
  };

  return (
    <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">当月流水明细</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 text-white hover:bg-orange-600">
              <PlusCircle className="mr-2 h-4 w-4" /> 记一笔
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>添加收支记录</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>记录类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INCOME">入账 (收入)</SelectItem>
                          <SelectItem value="EXPENSE">出账 (支出)</SelectItem>
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
                      <FormLabel>发生金额</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>发生日期</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''
                          }
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>摘要/说明</FormLabel>
                      <FormControl>
                        <Textarea placeholder="输入款项说明" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? '保存中...' : '确认记录'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>原因/摘要</TableHead>
            <TableHead className="text-right">金额 (元)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                当前月份尚无流水记录
              </TableCell>
            </TableRow>
          ) : (
            initialData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  {row.type === '收入' ? (
                    <Badge
                      variant="outline"
                      className="border-green-500 bg-green-50 text-green-600"
                    >
                      收入
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500 bg-red-50 text-red-600">
                      支出
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell
                  className={`text-right font-medium ${row.type === '收入' ? 'text-green-600' : 'text-red-500'}`}
                >
                  {row.type === '收入' ? '+' : '-'}
                  {row.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
