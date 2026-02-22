'use client';
import { logger } from '@/shared/lib/logger';

import { useState, type ReactNode, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { addPOLogistics } from '../actions/po-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// 支持两种使用模式：受控模式 (open/onClose) 和触发器模式 (trigger)
interface AddLogisticsDialogProps {
    poId: string;
    open?: boolean;
    onClose?: () => void;
    trigger?: ReactNode;
}

interface LogisticsFormData {
    company: string;
    trackingNo: string;
    shippedAt: Date;
    remark: string;
}

export function AddLogisticsDialog({ poId, open: controlledOpen, onClose, trigger }: AddLogisticsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    // 如果提供 trigger，则使用内部状态管理；否则使用受控模式
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const handleOpenChange = (value: boolean) => {
        if (isControlled) {
            if (!value && onClose) onClose();
        } else {
            setInternalOpen(value);
        }
    };
    const form = useForm<LogisticsFormData>({
        defaultValues: {
            company: '',
            trackingNo: '',
            shippedAt: new Date(),
            remark: ''
        }
    });

    const handleSubmit = async (data: LogisticsFormData) => {
        startTransition(async () => {
            try {
                await addPOLogistics({
                    poId,
                    company: data.company,
                    trackingNo: data.trackingNo,
                    shippedAt: data.shippedAt,
                    remark: data.remark
                });
                toast.success('物流信息已填写');
                form.reset();
                handleOpenChange(false);
            } catch (error) {
                const message = error instanceof Error ? error.message : '未知系统错误';
                toast.error('填写物流信息失败', { description: message });
                logger.error(error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>填写物流信息</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">物流公司</Label>
                        <Select
                            onValueChange={(value) => form.setValue('company', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择物流公司" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SF">顺丰速运</SelectItem>
                                <SelectItem value="ZTO">中通快递</SelectItem>
                                <SelectItem value="YTO">圆通速递</SelectItem>
                                <SelectItem value="STO">申通快递</SelectItem>
                                <SelectItem value="YD">韵达速递</SelectItem>
                                <SelectItem value="DBL">德邦快递</SelectItem>
                                <SelectItem value="OTHER">其他</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trackingNo">物流单号</Label>
                        <Input
                            id="trackingNo"
                            {...form.register('trackingNo', { required: true })}
                            placeholder="请输入物流单号"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remark">备注</Label>
                        <Input
                            id="remark"
                            {...form.register('remark')}
                            placeholder="备注信息（可选）"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            确认
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}