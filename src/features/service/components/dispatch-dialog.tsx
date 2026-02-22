'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { DatePicker } from '@/shared/ui/date-picker';
import { getInstallers, dispatchInstallTask } from '@/features/service/actions/install-actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props {
    taskId: string;
    trigger?: React.ReactNode;
}

export function DispatchDialog({ taskId, trigger }: Props) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date>();
    const [timeSlot, setTimeSlot] = useState('');
    const [installerId, setInstallerId] = useState('');
    const [installers, setInstallers] = useState<{ id: string, name: string | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getInstallers().then(res => {
                if (res.success) {
                    setInstallers(res.data || []);
                }
                setLoading(false);
            });
        }
    }, [open]);

    async function handleSubmit() {
        if (!date || !timeSlot || !installerId) {
            toast.error('请填写完整调度信息');
            return;
        }

        setSubmitting(true);
        try {
            const res = await dispatchInstallTask({
                taskId,
                installerId,
                scheduledDate: date.toISOString(),
                scheduledTimeSlot: timeSlot
            });

            if (res.success) {
                toast.success('派单成功');
                setOpen(false);
            } else {
                toast.error(res.error || '派单失败');
            }
        } catch {
            toast.error('网络错误');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm">派单</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>任务派单</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>选择安装师傅</Label>
                        <Select value={installerId} onValueChange={setInstallerId}>
                            <SelectTrigger>
                                <SelectValue placeholder={loading ? "加载中..." : "选择师傅"} />
                            </SelectTrigger>
                            <SelectContent>
                                {installers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name || '未知师傅'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>预约日期</Label>
                        <DatePicker value={date} onChange={setDate} />
                    </div>
                    <div className="grid gap-2">
                        <Label>时间段</Label>
                        <Select value={timeSlot} onValueChange={setTimeSlot}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择时间段" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="上午 (09:00-12:00)">上午 (09:00-12:00)</SelectItem>
                                <SelectItem value="下午 (14:00-18:00)">下午 (14:00-18:00)</SelectItem>
                                <SelectItem value="全天">全天</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认派单
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
