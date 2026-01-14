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
} from "@/shared/ui/dialog"

interface QuoteToOrderButtonProps {
    quoteId: string;
}

export function QuoteToOrderButton({ quoteId }: QuoteToOrderButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        startTransition(async () => {
            try {
                const result = await createOrderFromQuote({ quoteId });
                if (result.success && result.data) {
                    toast.success(`订单 ${result.data.orderNo} 创建成功`);
                    router.push(`/orders/${result.data.id}`);
                } else {
                    toast.error('创建订单失败');
                }
            } catch (error) {
                console.error(error);
                toast.error('创建订单出错');
            } finally {
                setOpen(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    转为订单
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认转为订单?</DialogTitle>
                    <DialogDescription>
                        这将锁定当前报价单，并生成一个新的订单记录�?
                        报价单一旦锁定将无法在其基础上继续修改�?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button onClick={(e) => {
                        e.preventDefault();
                        handleConfirm();
                    }} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认转换
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
