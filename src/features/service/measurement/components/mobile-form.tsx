'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { submitMeasureData } from '../actions/workflows';
import { measureSheetSchema } from '../schemas';
import { NumericKeypad } from './mobile/measure-input';

const WINDOW_TYPES = ['平开窗', '推拉窗', '固定窗', '圆弧窗', '异型窗'];

interface MeasurementMobileFormProps {
    taskId: string;
    onSuccess?: () => void;
}

export function MeasurementMobileForm({ taskId, onSuccess }: MeasurementMobileFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [activeField, setActiveField] = useState<'width' | 'height' | null>(null);

    const form = useForm({
        resolver: zodResolver(measureSheetSchema),
        defaultValues: {
            taskId,
            round: 1,
            variant: 'A',
            items: [{
                roomName: '',
                windowType: 'STRAIGHT',
                width: 0,
                height: 0,
            }]
        }
    });

    const onSubmit = async (data: z.infer<typeof measureSheetSchema>) => {
        setSubmitting(true);
        try {
            const result = await submitMeasureData(data);
            if (result.success) {
                toast.success('测量数据已提交');
                onSuccess?.();
            } else {
                toast.error((result as Record<string, unknown>).error as string || '提交失败');
            }
        } catch (_error) {
            toast.error('提交过程中发生错误');
        } finally {
            setSubmitting(false);
        }
    };

    const items = form.watch('items');

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-40">
            <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
                <h3 className="font-semibold border-b pb-2">房间 A</h3>

                <div className="space-y-2">
                    <Label>房间名称</Label>
                    <Input
                        {...form.register('items.0.roomName')}
                        placeholder="如：主卧"
                        className="bg-background"
                    />
                </div>

                <div className="space-y-2">
                    <Label>窗型</Label>
                    <Select
                        value={items[0].windowType}
                        onValueChange={(v) => form.setValue('items.0.windowType', v as 'STRAIGHT' | 'L_SHAPE' | 'U_SHAPE' | 'ARC')}
                    >
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="选择窗型" />
                        </SelectTrigger>
                        <SelectContent>
                            {WINDOW_TYPES.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div
                        className={`p-3 border rounded-md cursor-pointer ${activeField === 'width' ? 'ring-2 ring-blue-500' : 'bg-background'}`}
                        onClick={() => setActiveField('width')}
                    >
                        <Label className="text-xs text-muted-foreground">宽度 (mm)</Label>
                        <div className="text-xl font-mono mt-1">{items[0].width || '--'}</div>
                    </div>
                    <div
                        className={`p-3 border rounded-md cursor-pointer ${activeField === 'height' ? 'ring-2 ring-blue-500' : 'bg-background'}`}
                        onClick={() => setActiveField('height')}
                    >
                        <Label className="text-xs text-muted-foreground">高度 (mm)</Label>
                        <div className="text-xl font-mono mt-1">{items[0].height || '--'}</div>
                    </div>
                </div>
            </div>

            <div className="px-4">
                <Button type="submit" className="w-full text-lg h-12" disabled={submitting}>
                    {submitting ? '提交中...' : '提交测量数据'}
                </Button>
            </div>

            {activeField && (
                <NumericKeypad
                    value={activeField === 'width' ? items[0].width : items[0].height}
                    onValueChange={(val) => {
                        if (activeField === 'width') form.setValue('items.0.width', val);
                        else form.setValue('items.0.height', val);
                    }}
                    onNext={() => {
                        if (activeField === 'width') setActiveField('height');
                        else setActiveField(null);
                    }}
                />
            )}
        </form>
    );
}
