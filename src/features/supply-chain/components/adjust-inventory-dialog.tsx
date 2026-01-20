'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { adjustInventory } from '@/features/supply-chain/actions/inventory-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// ... (imports)

const formSchema = z.object({
    warehouseId: z.string().min(1, '请输入仓库ID'), // 临时，后续改为选择
    productId: z.string().min(1, '请输入产品ID'),   // 临时
    quantity: z.coerce.number().int(),
    reason: z.string().optional(),
});

interface Props {
    trigger: React.ReactNode;
}

export function AdjustInventoryDialog({ trigger }: Props) {
    const [open, setOpen] = useState(false);
    // const { toast } = useToast(); // Removed

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            warehouseId: '',
            productId: '',
            quantity: 0,
            reason: '',
        },
    });

    const { isSubmitting } = form.formState;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await adjustInventory(values);
            if (result.success) {
                toast.success('库存调整成功');
                setOpen(false);
                form.reset();
            } else {
                toast.error('调整失败', { description: result.error });
            }
        } catch (error) {
            toast.error('系统错误', { description: String(error) });
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>库存手动调整</DialogTitle>
                    <DialogDescription>
                        直接调整指定仓库和产品的库存数量。正数增加，负数减少。
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="warehouseId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>仓库 ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入仓库UUID" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>产品 ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="输入产品UUID" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>调整数量 (+/-)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>原因备注</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                提交调整
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
