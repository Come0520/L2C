// @ts-nocheck
'use client';

import { toast } from 'sonner';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChartOfAccount, updateChartOfAccount } from '../actions/chart-of-accounts-actions';
import {
  CreateAccountInput,
  CreateAccountSchema,
  UpdateAccountInput,
  UpdateAccountSchema,
} from '../types/chart-of-accounts';
import { AccountCategory, ACCOUNT_CATEGORIES } from '../constants/account-categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ChartOfAccount } from '../types/account';

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // 如果是编辑传入 existingAccount，如果是新增则 null
  existingAccount?: ChartOfAccount | null;
  // 如果是新增子科目，会传入 parentId，如果是新增顶级科目则为空
  parentId?: string;
  parentCategory?: AccountCategory;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  existingAccount,
  parentId,
  parentCategory,
}: AccountFormDialogProps) {
  const [isPending, startTransition] = useTransition();

  const isEdit = !!existingAccount;
  const isSystemDefault = existingAccount?.isSystemDefault;

  // 新增子科目时强制继承父级的类别（如果传了 parentCategory），否则可以自由选择
  const defaultCategory = existingAccount?.category || parentCategory || 'ASSET';

  const form = useForm<CreateAccountInput | UpdateAccountInput>({
    resolver: zodResolver(isEdit ? UpdateAccountSchema : CreateAccountSchema),
    defaultValues: {
      id: existingAccount?.id,
      code: existingAccount?.code || '',
      name: existingAccount?.name || '',
      description: existingAccount?.description || '',
      category: defaultCategory,
      parentId,
    },
  });

  const onSubmit = (data: any) => {
    startTransition(async () => {
      try {
        let result;
        if (isEdit) {
          result = await updateChartOfAccount(data as UpdateAccountInput);
        } else {
          result = await createChartOfAccount(data as CreateAccountInput);
        }

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if ((result as any).warning) {
          toast.warning((result as any).warning);
        } else {
          toast.success(isEdit ? '编辑科目成功' : '新增科目成功');
        }

        onOpenChange(false);
      } catch (_error) {
        toast.error('操作失败，请重试');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '编辑会计科目' : parentId ? '新增子科目' : '新增顶级科目'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEdit && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>科目大类</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!parentCategory} // 新增子科目强制继承父级，不可修改
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择科目大类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(ACCOUNT_CATEGORIES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>科目编码</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSystemDefault || isPending}
                      placeholder="例如: 1001"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>科目名称</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSystemDefault || isPending}
                      placeholder="例如: 库存现金"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>科目说明</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isPending}
                      placeholder="选填"
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
