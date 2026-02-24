'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload } from '@/shared/components/photo-upload/photo-upload';
import { createShowroomItem } from '@/features/showroom/actions';
import { createShowroomItemSchema } from '@/features/showroom/actions/schema';
import { z } from 'zod';
import { toast } from 'sonner';

type FormValues = z.infer<typeof createShowroomItemSchema>;

/**
 * 新增素材对话框组件
 * 内部封装了素材创建表单，包含素材类型、标题、内容、图片上传和标签。
 * 提交成功后自动刷新路径缓存并关闭弹窗。
 */
export function AddResourceDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver 与 react-hook-form 泛型已知不兼容
    resolver: zodResolver(createShowroomItemSchema) as any,
    defaultValues: {
      type: 'CASE',
      title: '',
      content: '',
      images: [],
      tags: [],
      productId: undefined,
      status: 'PUBLISHED',
    },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await createShowroomItem(data);
        toast.success('素材添加成功');
        setOpen(false);
        form.reset();
      } catch (error) {
        toast.error('添加失败，请重试');
        console.error(error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> 新增素材
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>新增素材</DialogTitle>
          <DialogDescription>添加商品图或案例到云展厅，供销售分享。</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">类型</Label>
            <div className="col-span-3">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">🏷️ 商品</SelectItem>
                      <SelectItem value="CASE">🏠 案例</SelectItem>
                      <SelectItem value="KNOWLEDGE">📖 知识</SelectItem>
                      <SelectItem value="TRAINING">📋 培训</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">标题</Label>
            <div className="col-span-3">
              <Input id="title" {...form.register('title')} />
              {form.formState.errors.title && (
                <span className="text-red-500 text-xs mt-1 block">{form.formState.errors.title.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">详情</Label>
            <Textarea id="content" className="col-span-3 min-h-[100px]" {...form.register('content')} placeholder="支持简单的文本描述..." />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags-input" className="text-right">标签</Label>
            <div className="col-span-3">
              <Controller
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <Input
                    id="tags-input"
                    placeholder="现代, 简约 (逗号分隔)"
                    // Convert array to string for display, handling undefined
                    value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Split by comma (english or chinese), trim, filter empty
                      const tags = val.split(/[,，]/).map(t => t.trim()).filter(Boolean);
                      field.onChange(tags);
                    }}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground mt-1">多个标签用逗号分隔</p>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">图片</Label>
            <div className="col-span-3">
              <Controller
                control={form.control}
                name="images"
                render={({ field }) => (
                  <PhotoUpload
                    value={field.value}
                    onChange={field.onChange}
                    maxFiles={9}
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button variant="ghost" onClick={() => setOpen(false)} type="button">取消</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存并上架
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
