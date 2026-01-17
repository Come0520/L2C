'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { toast } from 'sonner';
import { createMeasureTask } from '../actions/mutations';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { DatePicker } from '@/shared/ui/date-picker'; // Assuming DatePicker exists or use Input type="datetime-local"

export function CreateMeasureTaskDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Simple state for now, ideally use react-hook-form + zod
    const [formData, setFormData] = useState({
        leadId: '',
        customerId: '',
        scheduledAt: new Date(),
        remark: ''
    });

    const handleCreate = async () => {
        if (!formData.leadId || !formData.customerId) {
            toast.error('Lead ID and Customer ID are required');
            return;
        }

        setLoading(true);
        try {
            const res = await createMeasureTask({
                leadId: formData.leadId,
                customerId: formData.customerId,
                scheduledAt: formData.scheduledAt.toISOString(),
                remark: formData.remark,
            }, 'user-id-placeholder', 'tenant-id-placeholder'); // User/Tenant ID should come from context/auth

            if (res.success) {
                toast.success('测量任务已创建');
                setOpen(false);
                setFormData({ leadId: '', customerId: '', scheduledAt: new Date(), remark: '' });
            }
        } catch (error) {
            console.error(error);
            toast.error('创建失败');
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
                        <Label htmlFor="leadId" className="text-right">
                            线索 ID
                        </Label>
                        <Input
                            id="leadId"
                            value={formData.leadId}
                            onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                            className="col-span-3"
                            placeholder="UUID"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="customerId" className="text-right">
                            客户 ID
                        </Label>
                        <Input
                            id="customerId"
                            value={formData.customerId}
                            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                            className="col-span-3"
                            placeholder="UUID"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="scheduledAt" className="text-right">
                            预约时间
                        </Label>
                        <div className="col-span-3">
                            <Input
                                type="datetime-local"
                                value={formData.scheduledAt.toISOString().slice(0, 16)}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: new Date(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="remark" className="text-right">
                            备注
                        </Label>
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
                        {loading ? '创建中...' : '创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
