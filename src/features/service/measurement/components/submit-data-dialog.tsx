'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { submitMeasureData } from '../actions/workflows';
import { WINDOW_TYPES } from '../schemas';

interface SubmitDataDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    taskId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function SubmitDataDialog({ open: controlledOpen, onOpenChange: setControlledOpen, taskId, onSuccess, trigger }: SubmitDataDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled ? setControlledOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);

    // 基础表单状态 (一期实现核心逻辑连接)
    const [roomName, setRoomName] = useState('客厅');
    const [windowType, setWindowType] = useState<typeof WINDOW_TYPES[number]>('STRAIGHT');
    const [width, setWidth] = useState('2500');
    const [height, setHeight] = useState('2400');

    const handleSubmit = async () => {
        if (!roomName || !width || !height) {
            toast.error('请填写完整信息');
            return;
        }

        setLoading(true);
        try {
            const result = await submitMeasureData({
                taskId,
                round: 1,
                variant: 'A',
                items: [
                    {
                        roomName,
                        windowType,
                        width: Number(width),
                        height: Number(height),
                        installType: 'TOP',
                        hasBox: false,
                        isElectric: false
                    }
                ],
                sitePhotos: []
            });

            if (result.success) {
                toast.success('测量数据已成功提交');
                if (onSuccess) onSuccess();
                onOpenChange?.(false);
            } else {
                // @ts-expect-error - Response returns error object with message
                toast.error(result.error || '提交失败');
            }
        } catch (error) {
            console.error('Submit measurement data error:', error);
            toast.error('提交过程中发生错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>提交测量数据</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="room" className="text-right">空间名称</Label>
                        <Input id="room" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">窗型</Label>
                        <Select value={windowType} onValueChange={(v: string) => setWindowType(v as typeof WINDOW_TYPES[number])}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="选择窗型" />
                            </SelectTrigger>
                            <SelectContent>
                                {WINDOW_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="width" className="text-right">宽度 (mm)</Label>
                        <Input id="width" type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="height" className="text-right">高度 (mm)</Label>
                        <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange?.(false)}>取消</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? '提交中...' : '提交数据'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
