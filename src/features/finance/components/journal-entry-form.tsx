'use client';

import { toast } from 'sonner';
import { useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createJournalEntrySchema } from '../actions/schema';
import { z } from 'zod';
type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
import { createJournalEntry } from '../actions/journal-entry-actions';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import Decimal from 'decimal.js';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';

interface JournalEntryFormProps {
  accountOptions: { id: string; code: string; name: string }[];
  periodOptions: { id: string; year: number; month: number }[];
  onSuccess?: () => void;
}

export function JournalEntryForm({
  accountOptions,
  periodOptions,
  onSuccess,
}: JournalEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<any>({
    resolver: zodResolver(createJournalEntrySchema) as any,
    defaultValues: {
      periodId: '',
      entryDate: new Date(),
      description: '',
      lines: [
        { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
        { accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  // 观察借贷总额实时变化
  const watchedLines = form.watch('lines');
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  watchedLines.forEach((line: NonNullable<CreateJournalEntryInput['lines']>[number]) => {
    const d = new Decimal(line?.debitAmount || 0);
    const c = new Decimal(line?.creditAmount || 0);
    if (!d.isNaN()) totalDebit = totalDebit.plus(d);
    if (!c.isNaN()) totalCredit = totalCredit.plus(c);
  });

  const isBalanced = totalDebit.equals(totalCredit) && !totalDebit.isZero();

  const onSubmit = (data: any) => {
    if (!isBalanced) {
      toast.error('凭证借贷不平衡，请检查分录金额');
      return;
    }

    startTransition(async () => {
      const result = await createJournalEntry(data);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success('凭证创建成功，状态为草稿');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/finance/journal');
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>手工记账</CardTitle>
            <CardDescription>填写凭证基础信息</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control as any}
              name="periodId"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>会计账期</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择所属账期" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periodOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.year}年{p.month}月
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
              name="entryDate"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>记账日期</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={isPending}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e: any) => field.onChange(new Date(e.target.value))}
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
                    <FormLabel>凭证摘要</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isPending}
                        placeholder="简要描述本次经济业务"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>凭证明细分录</CardTitle>
              <CardDescription>至少需要两行明细以保证借贷平衡</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ accountId: '', debitAmount: 0, creditAmount: 0, description: '' })
              }
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加分录
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 分录表头 */}
              <div className="text-muted-foreground grid grid-cols-12 gap-2 border-b pb-2 text-sm font-medium">
                <div className="col-span-3">摘要</div>
                <div className="col-span-4">会计科目</div>
                <div className="col-span-2 text-right">借方金额</div>
                <div className="col-span-2 text-right">贷方金额</div>
                <div className="col-span-1 text-center">操作</div>
              </div>

              {/* 分录列表 */}
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 items-start gap-2">
                  <div className="col-span-3">
                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.description`}
                      render={({ field: f }: any) => (
                        <FormItem>
                          <FormControl>
                            <Input {...f} placeholder="明细摘要" disabled={isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-4">
                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.accountId`}
                      render={({ field: f }: any) => (
                        <FormItem>
                          <Select
                            onValueChange={f.onChange}
                            defaultValue={f.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="科目" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accountOptions.map((acc: any) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.code} {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.debitAmount`}
                      render={({ field: f }: any) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="text-right"
                              disabled={isPending || watchedLines[index]?.creditAmount > 0}
                              {...f}
                              onChange={(e: any) =>
                                f.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control as any}
                      name={`lines.${index}.creditAmount`}
                      render={({ field: f }: any) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              className="text-right"
                              disabled={isPending || watchedLines[index]?.debitAmount > 0}
                              {...f}
                              onChange={(e: any) =>
                                f.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                      disabled={isPending || fields.length <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* 合计栏 */}
              <div className="grid grid-cols-12 gap-2 border-t pt-4 text-sm font-medium">
                <div className="col-span-7 pr-4 text-right">合计:</div>
                <div
                  className={`col-span-2 text-right ${!isBalanced && totalDebit.gt(0) ? 'text-destructive' : ''}`}
                >
                  {totalDebit.toFixed(2)}
                </div>
                <div
                  className={`col-span-2 text-right ${!isBalanced && totalCredit.gt(0) ? 'text-destructive' : ''}`}
                >
                  {totalCredit.toFixed(2)}
                </div>
                <div className="col-span-1"></div>
              </div>
              {!isBalanced && (totalDebit.gt(0) || totalCredit.gt(0)) && (
                <p className="text-destructive mt-1 pr-6 text-right text-sm font-medium">
                  借贷不平衡，相差 {totalDebit.minus(totalCredit).abs().toFixed(2)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            取消
          </Button>
          <Button type="submit" disabled={isPending || !isBalanced}>
            {isPending ? '保存中...' : '保存为草稿'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
