'use client';

import { useState, useTransition, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { splitMeasureTaskSchema, PRODUCT_CATEGORIES } from '../schemas';
import { splitMeasureTask } from '../actions/mutations';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface SplitTaskDialogProps {
    originalTaskId: string; // 原任务 ID
    trigger?: React.ReactNode;
}

// 使用 splitMeasureTaskSchema 进行表单验证
const formSchema = splitMeasureTaskSchema;

export function SplitTaskDialog({ originalTaskId, trigger }: SplitTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            originalTaskId,
            splits: [{ category: 'CURTAIN' }, { category: 'WALLPAPER' }], // 默认两个品类
            reason: '',
        },
    });

    // 使用 react-hook-form 的 useFieldArray 来管理动态数组字段
    const { fields, append, remove } = useFieldArray({
        name: 'splits',
        control: form.control,
    });

    // 使用 useCallback 稳定回调引用
    const handleClose = useCallback(() => setOpen(false), []);
    const handleAppend = useCallback(() => append({ category: 'CURTAIN' }), [append]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const result = await splitMeasureTask(values);
            if (result?.success) {
                toast.success('拆单成功', { description: '原任务已取消，新任务已创建' });
                setOpen(false);
                form.reset();
            } else {
                toast.error('拆单失败', { description: (result && 'error' in result ? result.error : '未知错误') as string });
            }
        });
    }

    // 获取可用品类列表
    const categories = PRODUCT_CATEGORIES;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">拆分测量单</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>拆分测量任务</DialogTitle>
                    <DialogDescription>
                        将当前任务拆分为多个子任务，按品类分配给不同的测量师。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-end border p-3 rounded-md">
                                    <FormField
                                        control={form.control}
                                        name={`splits.${index}.category`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>品类</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="选择品类" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map((cat) => (
                                                            <SelectItem key={cat} value={cat}>
                                                                {cat}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* 可扩展: 添加测量师选择器 */}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (fields.length > 2) {
                                                remove(index);
                                            } else {
                                                toast.warning('至少保留两个拆分项');
                                            }
                                        }}
                                        className="mb-0.5"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleAppend}
                        >
                            <Plus className="mr-2 h-4 w-4" /> 添加拆分项
                        </Button>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>拆单原因</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="请输入拆单原因..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                取消
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? '提交中...' : '确认拆分'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
