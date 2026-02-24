'use client';

import { useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ChannelGradeDiscounts, updateChannelGradeDiscounts } from '../actions/channel-config';
import Loader2 from 'lucide-react/dist/esm/icons/loader';

// 使用 number() 而非 coerce.number() 以避免类型推断问题
const formSchema = z.object({
    S: z.number().min(0).max(1),
    A: z.number().min(0).max(1),
    B: z.number().min(0).max(1),
    C: z.number().min(0).max(1),
});

type FormValues = z.infer<typeof formSchema>;

interface GradeDiscountConfigFormProps {
    initialData: ChannelGradeDiscounts;
}

export function GradeDiscountConfigForm({ initialData }: GradeDiscountConfigFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            S: initialData.S,
            A: initialData.A,
            B: initialData.B,
            C: initialData.C,
        },
    });

    const onSubmit: SubmitHandler<FormValues> = (values) => {
        startTransition(async () => {
            const res = await updateChannelGradeDiscounts(values);
            if (res.success) {
                toast.success('等级折扣配置已更新');
            } else {
                toast.error(res.error || '更新失败');
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>渠道等级折扣配置</CardTitle>
                <CardDescription>
                    设置不同等级渠道在"底价供货"模式下的折扣率 (例如 0.95 代表 95 折)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="S"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>S级渠道折扣率</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>通常折扣最大</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="A"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>A级渠道折扣率</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="B"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>B级渠道折扣率</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="C"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>C级渠道折扣率</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormDescription>通常为原价 (1.00)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            保存配置
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
