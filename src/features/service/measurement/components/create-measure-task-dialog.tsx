'use client';


import { logger } from '@/shared/lib/logger';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { createMeasureTask } from '../actions/create-task';
import Plus from 'lucide-react/dist/esm/icons/plus';

export function CreateMeasureTaskDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        leadId: '',
        customerId: '',
        scheduledAt: new Date(),
        isFeeExempt: false,
        type: 'BLIND',
        remark: ''
    });

    const handleCreate = async () => {
        if (!formData.leadId || !formData.customerId) {
            toast.error('请填写线索和客户 ID');
            return;
        }

        setLoading(true);
        try {
            const res = await createMeasureTask({
                leadId: formData.leadId,
                customerId: formData.customerId,
                scheduledAt: formData.scheduledAt.toISOString(),
                isFeeExempt: formData.isFeeExempt,
                type: formData.type as 'QUOTE_BASED' | 'BLIND' | 'SALES_SELF',
                remark: formData.remark,
            });

            if (res.success) {
                toast.success(formData.isFeeExempt && formData.type !== 'SALES_SELF' ? '任务已提交审批' : '测量任务已创建');
                setOpen(false);
                setFormData({ leadId: '', customerId: '', scheduledAt: new Date(), isFeeExempt: false, type: 'BLIND', remark: '' });
            } else {
                toast.error('error' in res ? res.error : '创建失败');
            }
        } catch (error: unknown) {
            logger.error(error);
            const message = error instanceof Error ? error.message : '创建失败';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> 新建测量
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>新建测量任务</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="leadId" className="text-right">线索 ID</Label>
                        <Input
                            id="leadId"
                            value={formData.leadId}
                            onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customerId" className="text-right">客户 ID</Label>
                        <Input
                            id="customerId"
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">测量类型</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BLIND">上门测量</SelectItem>
                                <SelectItem value="QUOTE_BASED">基于报价测量</SelectItem>
                                <SelectItem value="SALES_SELF">销售自测</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="scheduledAt" className="text-right">预约时间</Label>
                        <div className="col-span-3">
                            <Input
                                type="datetime-local"
                                value={formData.scheduledAt.toISOString().slice(0, 16)}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: new Date(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isFeeExempt" className="text-right">免收测量费</Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                                id="isFeeExempt"
                                checked={formData.isFeeExempt}
                                onCheckedChange={(checked) => setFormData({ ...formData, isFeeExempt: checked })}
                            />
                            <span className="text-sm text-muted-foreground">免收且非自测需审批</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="remark" className="text-right">备注</Label>
                        <Textarea
                            id="remark"
                            value={formData.remark}
                            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? '处理中...' : (formData.isFeeExempt && formData.type !== 'SALES_SELF' ? '提交审批' : '创建')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
