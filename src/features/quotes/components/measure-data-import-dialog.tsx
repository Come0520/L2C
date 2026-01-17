'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { Ruler, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { getMeasureTasksByCustomer, importMeasureItemsToQuote } from '../actions/quote-measure-actions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface MeasureDataImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customerId: string;
    quoteId: string;
    onSuccess?: () => void;
}

export function MeasureDataImportDialog({ open, onOpenChange, customerId, quoteId, onSuccess }: MeasureDataImportDialogProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, startImportTransition] = useTransition();

    // Fetch tasks when dialog opens
    useEffect(() => {
        if (open && customerId) {
            setIsLoading(true);
            getMeasureTasksByCustomer({ customerId })
                .then((result) => {
                    if (result.data) {
                        setTasks(result.data);
                        if (result.data.length > 0) {
                            setSelectedTask(result.data[0].id);
                        }
                    }
                })
                .finally(() => setIsLoading(false));
        }
    }, [open, customerId]);

    const handleTaskSelect = (taskId: string) => {
        setSelectedTask(taskId);
        setSelectedItems([]);
    };

    const handleItemToggle = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleSelectAll = (items: any[]) => {
        if (selectedItems.length === items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map(i => i.id));
        }
    };

    const handleImport = () => {
        if (selectedItems.length === 0) return;

        startImportTransition(async () => {
            const result = await importMeasureItemsToQuote({
                quoteId,
                measureItemIds: selectedItems
            });

            if (result.data?.success) {
                toast.success(`成功导入 ${result.data.count} 条测量数据`);
                onSuccess?.();
                onOpenChange(false);
            } else if (result.error) {
                toast.error(result.error);
            }
        });
    };

    const currentTask = tasks.find(t => t.id === selectedTask);
    const currentItems = currentTask?.items || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-white/50">
                    <DialogTitle className="flex items-center gap-2 text-xl font-medium">
                        <Ruler className="w-5 h-5 text-primary" />
                        导入测量数据
                    </DialogTitle>
                    <DialogDescription>
                        选择测量任务并导入数据到报价单。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left Panel: Task List */}
                    <div className="w-1/3 border-r bg-muted/10 flex flex-col">
                        <div className="p-3 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            测量任务列表
                        </div>
                        <ScrollArea className="flex-1">
                            {isLoading ? (
                                <div className="flex bg-center items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    暂无已完成的测量任务
                                </div>
                            ) : (
                                <div className="space-y-1 p-2">
                                    {tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskSelect(task.id)}
                                            className={cn(
                                                "w-full text-left p-3 rounded-lg text-sm transition-all duration-200 border",
                                                selectedTask === task.id
                                                    ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                                                    : "bg-transparent border-transparent hover:bg-muted/50 text-foreground"
                                            )}
                                        >
                                            <div className="font-medium truncate mb-1">
                                                {task.measureNo}
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {task.scheduledAt ? format(new Date(task.scheduledAt), 'yyyy-MM-dd') : '未预约'}
                                                </div>
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    R{task.round}
                                                </Badge>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Right Panel: Item Details */}
                    <div className="flex-1 flex flex-col bg-white/40">
                        <div className="p-3 border-b flex items-center justify-between bg-white/60">
                            <div className="text-sm font-medium flex items-center gap-2">
                                <span>测量明细</span>
                                <Badge variant="secondary" className="text-xs">
                                    {currentItems.length} 项
                                </Badge>
                            </div>
                            {currentItems.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleSelectAll(currentItems)}
                                >
                                    {selectedItems.length === currentItems.length ? '取消全选' : '全选'}
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {selectedTask ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {currentItems.map((item: any) => (
                                        <Card
                                            key={item.id}
                                            className={cn(
                                                "p-3 cursor-pointer transition-all duration-200 hover:shadow-md border",
                                                selectedItems.includes(item.id)
                                                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                                                    : "border-border/60 bg-white/80"
                                            )}
                                            onClick={() => handleItemToggle(item.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    checked={selectedItems.includes(item.id)}
                                                    onCheckedChange={() => handleItemToggle(item.id)}
                                                    className="mt-1"
                                                />
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">{item.roomName}</span>
                                                        <Badge variant="outline" className="text-[10px] px-1 h-5">
                                                            {item.windowType || '未定义'}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1 mt-2 bg-muted/20 p-2 rounded">
                                                        <div>
                                                            <span className="opacity-70">宽:</span> <span className="font-medium text-foreground">{item.width}</span>
                                                        </div>
                                                        <div>
                                                            <span className="opacity-70">高:</span> <span className="font-medium text-foreground">{item.height}</span>
                                                        </div>
                                                    </div>
                                                    {item.remark && (
                                                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                                                            备注: {item.remark}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <ArrowRight className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">请选择左侧任务查看明细</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            已选择 <span className="font-medium text-primary">{selectedItems.length}</span> 项
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                取消
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={selectedItems.length === 0 || isImporting}
                                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/20"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        导入中...
                                    </>
                                ) : (
                                    <>
                                        确认导入
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
