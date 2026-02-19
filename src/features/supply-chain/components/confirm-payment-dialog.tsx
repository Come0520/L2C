'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmPoPayment, confirmPaymentSchema } from '../actions/po-actions';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { UploadButton } from '@/shared/components/upload-button';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import X from 'lucide-react/dist/esm/icons/x';
import { format } from 'date-fns';

type ConfirmPaymentFormData = z.infer<typeof confirmPaymentSchema>;

interface ConfirmPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    poId: string;
    totalAmount?: number | string;
}

export function ConfirmPaymentDialog({
    open,
    onOpenChange,
    poId,
    totalAmount
}: ConfirmPaymentDialogProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
        reset
    } = useForm<ConfirmPaymentFormData>({
        resolver: zodResolver(confirmPaymentSchema),
        defaultValues: {
            poId,
            paymentMethod: 'BANK',
            paymentAmount: Number(totalAmount) || 0,
            paymentTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
            remark: ''
        }
    });

    useEffect(() => {
        if (open) {
            reset({
                poId,
                paymentMethod: 'BANK',
                paymentAmount: Number(totalAmount) || 0,
                paymentTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
                remark: '',
                paymentVoucherImg: undefined
            });
        }
    }, [open, poId, totalAmount, reset]);

    const onSubmit = async (data: ConfirmPaymentFormData) => {
        try {
            const result = await confirmPoPayment({
                ...data,
                paymentAmount: Number(data.paymentAmount),
            });
            if (!result.success) {
                toast.error(result.error || '确认付款失败');
                return;
            }
            toast.success('付款已确认，进入待发货状态');
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error('请求失败');
        }
    };

    const voucherImg = watch('paymentVoucherImg');
    const paymentMethod = watch('paymentMethod');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>确认付款</DialogTitle>
                    <DialogDescription>
                        请录入实际付款金额、时间和凭证。
                        <br />
                        确认后状态将更为 <strong>待发货</strong>。
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="paymentMethod">付款方式</Label>
                            <Select
                                value={paymentMethod}
                                onValueChange={(val: any) => setValue('paymentMethod', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择方式" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">银行转账</SelectItem>
                                    <SelectItem value="WECHAT">微信支付</SelectItem>
                                    <SelectItem value="ALIPAY">支付宝</SelectItem>
                                    <SelectItem value="CASH">现金</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.paymentMethod && (
                                <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentAmount">实付金额 (¥)</Label>
                            <Input
                                id="paymentAmount"
                                type="number"
                                step="0.01"
                                {...register('paymentAmount', { valueAsNumber: true })}
                            />
                            {errors.paymentAmount && (
                                <p className="text-sm text-red-500">{errors.paymentAmount.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="paymentTime">付款时间</Label>
                        <Input
                            id="paymentTime"
                            type="datetime-local"
                            {...register('paymentTime')}
                        />
                        {errors.paymentTime && (
                            <p className="text-sm text-red-500">{errors.paymentTime.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>付款凭证 (可选)</Label>
                        {voucherImg ? (
                            <div className="relative border rounded-md p-2 w-full h-40 flex items-center justify-center bg-muted/50">
                                <Image
                                    src={voucherImg}
                                    alt="Payment Voucher Preview"
                                    fill
                                    className="object-contain"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => setValue('paymentVoucherImg', undefined)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <UploadButton
                                onUploadComplete={(url) => setValue('paymentVoucherImg', url)}
                                label="上传付款图片"
                                className="w-full h-32"
                            />
                        )}
                        {errors.paymentVoucherImg && (
                            <p className="text-sm text-red-500">{errors.paymentVoucherImg.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remark">备注</Label>
                        <Textarea
                            id="remark"
                            rows={3}
                            placeholder="填写付款备注..."
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
                            确认付款
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
