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
import Ruler from 'lucide-react/dist/esm/icons/ruler';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import {
  getImportableMeasureTasks,
  previewMeasurementImport,
  executeMeasurementImport,
} from '../actions/measurement-actions';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { ImportPreviewResult } from '@/services/quote.service';
import { logger } from '@/shared/lib/logger';

interface MeasureDataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // customerId: string; // Not needed if we fetch quote by ID
  quoteId: string;
  onSuccess?: () => void;
}

interface MeasureTaskPreview {
  id: string;
  measureNo: string;
  scheduledAt?: string | Date | null;
  round: number;
  [key: string]: unknown;
}

export function MeasureDataImportDialog({
  open,
  onOpenChange,
  quoteId,
  onSuccess,
}: MeasureDataImportDialogProps) {
  const [step, setStep] = useState<'SELECT' | 'PREVIEW'>('SELECT');
  const [tasks, setTasks] = useState<MeasureTaskPreview[]>([]);
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
          logger.error(err);
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
    setSelectedActionIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
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
      <div className="bg-muted/10 flex w-1/3 flex-col border-r">
        <div className="bg-muted/20 text-muted-foreground p-3 text-xs font-semibold tracking-wider uppercase">
          测量任务列表
        </div>
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-sm">暂无可用测量任务</div>
          ) : (
            <div className="space-y-1 p-2">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm transition-all duration-200',
                    selectedTask === task.id
                      ? 'bg-primary/10 border-primary/20 text-primary shadow-sm'
                      : 'hover:bg-muted/50 text-foreground border-transparent bg-transparent'
                  )}
                >
                  <div className="mb-1 truncate font-medium">{task.measureNo}</div>
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {task.scheduledAt
                        ? format(new Date(task.scheduledAt), 'yyyy-MM-dd')
                        : '未预约'}
                    </div>
                    <Badge variant="outline" className="h-5 text-[10px]">
                      R{task.round}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Task Details Placeholder */}
      <div className="text-muted-foreground glass-empty-state flex flex-1 flex-col items-center justify-center">
        <Ruler className="mb-4 h-12 w-12 opacity-10" />
        <p>选择一个测量任务以预览数据</p>
        <Button className="mt-4" onClick={handlePreview} disabled={!selectedTask || isProcessing}>
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '下一步: 预览变更'}
        </Button>
      </div>
    </div>
  );

  const renderStepPreview = () => {
    if (!previewResult) return null;

    const selectedSet = new Set(selectedActionIndices);

    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="bg-muted/10 flex items-center justify-between border-b p-4">
          <div>
            <h4 className="text-sm font-medium">变更预览</h4>
            <div className="text-muted-foreground mt-1 flex gap-2 text-xs">
              <span className="flex items-center text-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" /> 新增: {previewResult.summary.created}
              </span>
              <span className="flex items-center text-amber-600">
                <AlertCircle className="mr-1 h-3 w-3" /> 主要变更: {previewResult.summary.updated}
              </span>
            </div>
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setStep('SELECT')}>
              返回选择
            </Button>
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={selectedActionIndices.length === 0 || isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '确认导入'}
            </Button>
          </div>
        </div>

        <div className="bg-card/40 flex flex-1 flex-col overflow-hidden">
          <div className="bg-card/60 flex items-center justify-between border-b p-2">
            <Button variant="ghost" size="sm" onClick={toggleAllActions} className="h-7 text-xs">
              {selectedActionIndices.length === previewResult.actions.length ? '取消全选' : '全选'}
            </Button>
            <span className="text-muted-foreground text-xs">
              已选 {selectedActionIndices.length} 项
            </span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {previewResult.actions.map((action, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    'cursor-pointer border p-3 transition-all',
                    selectedSet.has(idx)
                      ? 'border-primary/40 bg-primary/5'
                      : 'opacity-60 grayscale hover:grayscale-0'
                  )}
                  onClick={() => toggleAction(idx)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedSet.has(idx)}
                      onCheckedChange={() => toggleAction(idx)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{action.description}</div>
                        <Badge
                          variant={action.type === 'UPDATE_ITEM' ? 'default' : 'secondary'}
                          className={cn(
                            'text-[10px]',
                            action.type === 'UPDATE_ITEM' &&
                              'bg-amber-100 text-amber-700 hover:bg-amber-100',
                            action.type === 'CREATE_ITEM' &&
                              'bg-green-100 text-green-700 hover:bg-green-100',
                            action.type === 'CREATE_ROOM' &&
                              'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          )}
                        >
                          {action.type === 'UPDATE_ITEM'
                            ? '更 新'
                            : action.type === 'CREATE_ITEM'
                              ? '新 增'
                              : '新空间'}
                        </Badge>
                      </div>

                      {action.diff && (
                        <div className="bg-card/50 mt-2 flex flex-col gap-y-1 rounded p-2 text-xs">
                          {action.diff.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-muted-foreground w-12 capitalize">
                                {d.field}:
                              </span>
                              <span className="text-red-300 line-through">
                                {String(d.oldValue)}
                              </span>
                              <ArrowRight className="text-muted-foreground h-3 w-3" />
                              <span className="font-bold text-green-600">{String(d.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {action.type === 'CREATE_ITEM' && (
                        <div className="text-muted-foreground mt-1 text-xs">
                          {String(action.measureItem.roomName)} /{' '}
                          {String(action.measureItem.windowType)}
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-layout-card flex h-[600px] max-w-4xl flex-col overflow-hidden p-0 shadow-2xl">
        <DialogHeader className="bg-card/50 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-medium">
            <Ruler className="text-primary h-5 w-5" />
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
