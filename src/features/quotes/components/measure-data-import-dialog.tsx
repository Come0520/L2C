'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { Ruler, ArrowRight, Loader2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { getImportableMeasureTasks, previewMeasurementImport, executeMeasurementImport } from '../actions/measurement-actions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { ImportPreviewResult } from '@/services/quote.service';

interface MeasureDataImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // customerId: string; // Not needed if we fetch quote by ID
    quoteId: string;
    onSuccess?: () => void;
}

export function MeasureDataImportDialog({ open, onOpenChange, quoteId, onSuccess }: MeasureDataImportDialogProps) {
    const [step, setStep] = useState<'SELECT' | 'PREVIEW'>('SELECT');
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);

    // Preview State
    const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
    const [selectedActionIndices, setSelectedActionIndices] = useState<number[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, startTransition] = useTransition();

    // Reset when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setStep('SELECT');
            setSelectedTask(null);
            setPreviewResult(null);
            setSelectedActionIndices([]);
        } else {
            const fetchTasks = async () => {
                setIsLoading(true);
                try {
                    const result = await getImportableMeasureTasks(quoteId);
                    if (result.success && result.data) {
                        setTasks(result.data);
                        if (result.data.length > 0) setSelectedTask(result.data[0].id);
                    } else {
                        toast.error(result.error || 'Failed to load tasks');
                    }
                } catch (err) {
                    console.error(err);
                    toast.error('Error loading measurement tasks');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchTasks();
        }
    }, [open, quoteId]);

    const handlePreview = () => {
        if (!selectedTask) return;

        startTransition(async () => {
            const result = await previewMeasurementImport({ quoteId, measureTaskId: selectedTask });
            if (result?.data) {
                setPreviewResult(result.data);
                // Default select all actions
                setSelectedActionIndices(result.data.actions.map((_, idx) => idx));
                setStep('PREVIEW');
            } else {
                toast.error('Failed to preview import');
            }
        });
    };

    const handleExecute = () => {
        if (!previewResult || selectedActionIndices.length === 0) return;

        // 使用 Set 优化查找性能 O(N*M) -> O(N)
        const selectedSet = new Set(selectedActionIndices);
        const actionsToExecute = previewResult.actions.filter((_, idx) => selectedSet.has(idx));

        startTransition(async () => {
            const result = await executeMeasurementImport({ quoteId, actions: actionsToExecute });
            if (result?.data?.success) {
                toast.success(`Successfully processed ${result.data.count} items`);
                onSuccess?.();
                onOpenChange(false);
            } else {
                toast.error('Import failed');
            }
        });
    };

    const toggleAction = (index: number) => {
        setSelectedActionIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const toggleAllActions = () => {
        if (!previewResult) return;
        if (selectedActionIndices.length === previewResult.actions.length) {
            setSelectedActionIndices([]);
        } else {
            setSelectedActionIndices(previewResult.actions.map((_, idx) => idx));
        }
    };

    // Render Steps
    const renderStepSelect = () => (
        <div className="flex flex-1 overflow-hidden">
            {/* Task List */}
            <div className="w-1/3 border-r bg-muted/10 flex flex-col">
                <div className="p-3 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    测量任务列表
                </div>
                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            暂无可用测量任务
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {tasks.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTask(task.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg text-sm transition-all duration-200 border",
                                        selectedTask === task.id
                                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                                            : "bg-transparent border-transparent hover:bg-muted/50 text-foreground"
                                    )}
                                >
                                    <div className="font-medium truncate mb-1">{task.measureNo}</div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {task.scheduledAt ? format(new Date(task.scheduledAt), 'yyyy-MM-dd') : '未预约'}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] h-5">R{task.round}</Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Task Details Placeholder */}
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground glass-empty-state">
                <Ruler className="w-12 h-12 mb-4 opacity-10" />
                <p>选择一个测量任务以预览数据</p>
                <Button className="mt-4" onClick={handlePreview} disabled={!selectedTask || isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : '下一步: 预览变更'}
                </Button>
            </div>
        </div>
    );

    const renderStepPreview = () => {
        if (!previewResult) return null;

        const selectedSet = new Set(selectedActionIndices);

        return (
            <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b bg-muted/10 flex items-center justify-between">
                    <div>
                        <h4 className="font-medium text-sm">变更预览</h4>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                            <span className="text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> 新增: {previewResult.summary.created}</span>
                            <span className="text-amber-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> 主要变更: {previewResult.summary.updated}</span>
                        </div>
                    </div>
                    <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setStep('SELECT')}>返回选择</Button>
                        <Button size="sm" onClick={handleExecute} disabled={selectedActionIndices.length === 0 || isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : '确认导入'}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-card/40">
                    <div className="p-2 border-b flex justify-between items-center bg-card/60">
                        <Button variant="ghost" size="sm" onClick={toggleAllActions} className="text-xs h-7">
                            {selectedActionIndices.length === previewResult.actions.length ? '取消全选' : '全选'}
                        </Button>
                        <span className="text-xs text-muted-foreground">已选 {selectedActionIndices.length} 项</span>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-3">
                            {previewResult.actions.map((action, idx) => (
                                <Card
                                    key={idx}
                                    className={cn(
                                        "p-3 transition-all border cursor-pointer",
                                        selectedSet.has(idx) ? "border-primary/40 bg-primary/5" : "opacity-60 grayscale hover:grayscale-0"
                                    )}
                                    onClick={() => toggleAction(idx)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Checkbox checked={selectedSet.has(idx)} onCheckedChange={() => toggleAction(idx)} className="mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm">{action.description}</div>
                                                <Badge variant={action.type === 'UPDATE_ITEM' ? 'default' : 'secondary'} className={cn(
                                                    "text-[10px]",
                                                    action.type === 'UPDATE_ITEM' && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                                                    action.type === 'CREATE_ITEM' && "bg-green-100 text-green-700 hover:bg-green-100",
                                                    action.type === 'CREATE_ROOM' && "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                )}>
                                                    {action.type === 'UPDATE_ITEM' ? '更 新' : action.type === 'CREATE_ITEM' ? '新 增' : '新空间'}
                                                </Badge>
                                            </div>

                                            {action.diff && (
                                                <div className="mt-2 text-xs bg-card/50 p-2 rounded gap-y-1 flex flex-col">
                                                    {action.diff.map((d, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="text-muted-foreground w-12 capitalize">{d.field}:</span>
                                                            <span className="line-through text-red-300">{String(d.oldValue)}</span>
                                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                            <span className="font-bold text-green-600">{String(d.newValue)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {action.type === 'CREATE_ITEM' && (
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    {String(action.measureItem.roomName)} / {String(action.measureItem.windowType)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 overflow-hidden glass-layout-card shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-card/50">
                    <DialogTitle className="flex items-center gap-2 text-xl font-medium">
                        <Ruler className="w-5 h-5 text-primary" />
                        导入测量数据
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'SELECT' ? '选择测量任务' : '确认变更内容'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'SELECT' ? renderStepSelect() : renderStepPreview()}
            </DialogContent>
        </Dialog>
    );
}
