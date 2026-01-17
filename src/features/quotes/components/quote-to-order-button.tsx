'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { createOrderFromQuote } from '@/features/orders/actions';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';

interface QuoteToOrderButtonProps {
    quoteId: string;
}

export function QuoteToOrderButton({ quoteId }: QuoteToOrderButtonProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleConvert = () => {
        startTransition(async () => {
            try {
                // createOrderFromQuote returns Order object directly
                const order = await createOrderFromQuote({ quoteId });
                if (order?.id) {
                    toast.success(`订单 ${order.orderNo} 创建成功`);
                    router.push(`/orders/${order.id}`);
                } else {
                    toast.error('转换失败');
                }
            } catch (error: any) {
                toast.error(error?.message || '转换失败，请稍后重试');
            } finally {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                    <ArrowRight className="w-4 h-4" />
                    转为订单
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认转换</DialogTitle>
                    <DialogDescription>
                        将此报价单转换为正式订单，确认后报价单将被锁定。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button onClick={handleConvert} disabled={isPending}>
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        确认转换
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
