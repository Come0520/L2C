import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { DynamicQuoteForm } from './dynamic-quote-form';
import { createQuoteItem } from '../actions/mutations';
import { QuoteConfig } from '@/services/quote-config.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { createQuoteItemSchema } from '../actions/schema';

type QuoteItemFormValues = z.infer<typeof createQuoteItemSchema>;

interface CurtainFabricQuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId: string;
    roomId?: string | null;
    config: QuoteConfig;
}

export function CurtainFabricQuoteDialog({
    open,
    onOpenChange,
    quoteId,
    roomId,
    config
}: CurtainFabricQuoteDialogProps) {
    const router = useRouter();

    const handleSubmit = async (data: QuoteItemFormValues) => {
        try {
            await createQuoteItem(data);
            toast.success('添加成功');
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error('添加失败');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>添加窗帘报价</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <DynamicQuoteForm
                        quoteId={quoteId}
                        roomId={roomId}
                        category="CURTAIN"
                        config={config}
                        onSubmit={handleSubmit}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
