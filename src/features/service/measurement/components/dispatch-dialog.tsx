'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { dispatchMeasureTask } from '../actions/mutations';
import { getAvailableWorkers } from '../actions/queries';

interface DispatchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taskId: string;
    taskNo?: string;
    defaultScheduledAt?: Date;
}

export function DispatchDialog({ open, onOpenChange, taskId, taskNo, defaultScheduledAt }: DispatchDialogProps) {
    const [loading, setLoading] = useState(false);
    const [workers, setWorkers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        assignedWorkerId: '',
        scheduledAt: defaultScheduledAt || new Date(),
    });

    useEffect(() => {
        if (open) {
            getAvailableWorkers().then(res => {
                if (res.success && res.data) {
                    setWorkers(res.data);
                }
            });
            if (defaultScheduledAt) {
                setFormData(prev => ({ ...prev, scheduledAt: defaultScheduledAt }));
            }
        }
    }, [open, defaultScheduledAt]);

    const handleDispatch = async () => {
        if (!formData.assignedWorkerId) {
            toast.error('请选择测量师');
            return;
        }

        setLoading(true);
        try {
            const res = await dispatchMeasureTask({
                id: taskId,
                assignedWorkerId: formData.assignedWorkerId,
                scheduledAt: formData.scheduledAt.toISOString(),
            });

            if (res.success) {
                toast.success('指派成功');
                onOpenChange(false);
            }
        } catch (error) {
            console.error(error);
            toast.error('指派失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>指派测量任务 {taskNo && `- ${taskNo}`}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">测量师</Label>
                        <Select
                            value={formData.assignedWorkerId}
                            onValueChange={(val) => setFormData({ ...formData, assignedWorkerId: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择师傅" />
                            </SelectTrigger>
                            <SelectContent>
                                {workers.length === 0 ? (
                                    <SelectItem value="none" disabled>暂无可用师傅</SelectItem>
                                ) : (
                                    workers.map(worker => (
                                        <SelectItem key={worker.id} value={worker.id}>{worker.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">预约时间</Label>
                        <div className="col-span-3">
                            <Input
                                type="datetime-local"
                                value={formData.scheduledAt.toISOString().slice(0, 16)}
                                onChange={(e) => setFormData({ ...formData, scheduledAt: new Date(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleDispatch} disabled={loading}>
                        {loading ? '提交中...' : '提交'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
