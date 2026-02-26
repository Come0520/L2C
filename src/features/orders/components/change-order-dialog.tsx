'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import { toast } from 'sonner';
import { createChangeRequestAction } from '../actions/change-order';
import FileEdit from 'lucide-react/dist/esm/icons/file-edit';

interface ChangeOrderDialogProps {
    orderId: string;
    trigger?: React.ReactNode;
}

export function ChangeOrderDialog({ orderId, trigger }: ChangeOrderDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState<string>('FIELD_CHANGE');
    const [reason, setReason] = useState('');
    const [diffAmount, setDiffAmount] = useState('');

    const handleSubmit = async () => {
        if (!reason) {
            toast.error('请输入变更原因');
            return;
        }

        setLoading(true);
        try {
            const res = await createChangeRequestAction({
                orderId,
                type: type as 'FIELD_CHANGE' | 'CUSTOMER_CHANGE' | 'STOCK_OUT' | 'OTHER',
                reason,
                diffAmount
            });
            if (res.success) {
                toast.success('变更请求已提交');
                setOpen(false);
                setReason('');
                setDiffAmount('');
                // Ideally refresh page or list
            } else {
                toast.error('提交失败: ' + res.error);
            }
        } catch (_e) {
            toast.error('提交失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)}>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <FileEdit className="h-4 w-4 mr-2" />
                        变更订单
                    </Button>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>申请订单变更</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">变更类型</label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIELD_CHANGE">现场/尺寸变更</SelectItem>
                                    <SelectItem value="CUSTOMER_CHANGE">客户需求变更</SelectItem>
                                    <SelectItem value="STOCK_OUT">缺货/库存调整</SelectItem>
                                    <SelectItem value="OTHER">其他原因</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">涉及金额变动 (选填)</label>
                            <Input
                                type="number"
                                placeholder="0.00 (正数增加，负数减少)"
                                value={diffAmount}
                                onChange={e => setDiffAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">变更原因 / 备注</label>
                            <Textarea
                                placeholder="详细描述变更内容和原因..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? '提交中...' : '提交申请'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
