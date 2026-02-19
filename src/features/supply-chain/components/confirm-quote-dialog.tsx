'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmPoQuote } from '../actions/po-actions';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { UploadButton } from '@/shared/components/upload-button';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import X from 'lucide-react/dist/esm/icons/x';

const confirmQuoteSchema = z.object({
    poId: z.string().uuid(),
    totalAmount: z.coerce.number().min(0, "金额必须大于等于0"),
    supplierQuoteImg: z.string().url("请上传有效图片").optional(),
    remark: z.string().max(500, "备注最多500字").optional(),
});

type ConfirmQuoteFormData = z.infer<typeof confirmQuoteSchema>;

interface ConfirmQuoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poId: string;
    defaultAmount?: number | string;
}

export function ConfirmQuoteDialog({
    open,
    onOpenChange,
    poId,
    defaultAmount
}: ConfirmQuoteDialogProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ConfirmQuoteFormData>({
        resolver: zodResolver(confirmQuoteSchema) as any,
        defaultValues: {
            poId,
            totalAmount: Number(defaultAmount) || 0,
            remark: ''
        }
    });

    useEffect(() => {
        if (open) {
            reset({
                poId,
                totalAmount: Number(defaultAmount) || 0,
                remark: '',
                supplierQuoteImg: undefined
            });
        }
    }, [open, poId, defaultAmount, reset]);

    const onSubmit = async (data: ConfirmQuoteFormData) => {
        try {
            const result = await confirmPoQuote({
                ...data,
                totalAmount: Number(data.totalAmount)
            });
            if (!result.success) {
                toast.error(result.error || '确认报价失败');
                return;
            }
            toast.success('报价已确认，进入待付款状态');
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error('请求失败');
        }
    };

    const quoteImg = watch('supplierQuoteImg');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>确认供应商报价</DialogTitle>
                    <DialogDescription>
                        请核对供应商提供的报价单金额，并上传报价凭证。
                        <br />
                        确认后状态将更为 <strong>待付款</strong>。
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="totalAmount">确认金额 (¥)</Label>
                        <Input
                            id="totalAmount"
                            type="number"
                            step="0.01"
                            {...register('totalAmount')}
                        />
                        {errors.totalAmount && (
                            <p className="text-sm text-red-500">{errors.totalAmount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>报价单凭证 (可选)</Label>
                        {quoteImg ? (
                            <div className="relative border rounded-md p-2 w-full h-40 flex items-center justify-center bg-muted/50">
                                <Image
                                    src={quoteImg}
                                    alt="Quote Preview"
                                    fill
                                    className="object-contain"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => setValue('supplierQuoteImg', undefined)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <UploadButton
                                onUploadComplete={(url) => setValue('supplierQuoteImg', url)}
                                label="上传报价单图片"
                                className="w-full h-32"
                            />
                        )}
                        {errors.supplierQuoteImg && (
                            <p className="text-sm text-red-500">{errors.supplierQuoteImg.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remark">备注</Label>
                        <Textarea
                            id="remark"
                            rows={3}
                            placeholder="填写报价说明..."
                            {...register('remark')}
                        />
                        {errors.remark && (
                            <p className="text-sm text-red-500">{errors.remark.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认报价
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
