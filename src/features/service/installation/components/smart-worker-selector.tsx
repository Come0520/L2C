'use client';

import { useState, useEffect } from 'react';
import User from 'lucide-react/dist/esm/icons/user';
import Check from 'lucide-react/dist/esm/icons/check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import { cn } from '@/shared/utils';
import { getInstallWorkersAction } from '../actions';

import { format } from 'date-fns';

/** 安装师傅数据类型 */
interface InstallWorker {
  id: string;
  name: string | null;
  currentTaskCount?: number;
  dailyTaskLimit?: number;
  isFullyLoaded?: boolean;
}

/** 智能安装师选择器属性 */
interface SmartWorkerSelectorProps {
  value?: string;
  onSelect: (workerId: string) => void;
  scheduledDate?: Date;
}

/**
 * 智能安装师选择器
 *
 * 核心功能：
 * 1. 自动从服务端加载具备安装资质的师傅列表。
 * 2. 实时显示师傅当前的工作负载（待集成详细负载算法）。
 * 3. 提供直观的选中交互体验。
 */
export function SmartWorkerSelector({
  value,
  onSelect,
  scheduledDate,
}: SmartWorkerSelectorProps) {
  const [workers, setWorkers] = useState<InstallWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 避免 UTC 时区引起误差，使用 format 格式化为本地 YYYY-MM-DD
  const dateStr = scheduledDate ? format(scheduledDate, 'yyyy-MM-dd') : undefined;

  // 从 API 加载安装师列表
  useEffect(() => {
    async function loadWorkers() {
      setLoading(true);
      setError(null);

      try {
        const result = await getInstallWorkersAction(dateStr);
        if (result.success && result.data) {
          // 转换为组件需要的格式
          const workerList = result.data.map((user: any) => ({
            id: user.id,
            name: user.name,
            currentTaskCount: user.currentTaskCount || 0,
            dailyTaskLimit: user.dailyTaskLimit || 3,
            isFullyLoaded: user.isFullyLoaded || false,
          }));
          setWorkers(workerList);
        } else {
          setError(result.error || '加载失败');
        }
      } catch (_err) {
        setError('网络错误，请重试');
      } finally {
        setLoading(false);
      }
    }

    loadWorkers();
  }, [dateStr]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <span className="text-muted-foreground ml-2 text-sm">加载安装师列表...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive flex items-center justify-center py-8">
        <AlertCircle className="mr-2 h-5 w-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <User className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">暂无可用安装师</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">选择安装师</h4>
      <div className="grid grid-cols-1 gap-2">
        {workers.map((worker) => {
          const isFull = worker.isFullyLoaded;
          return (
            <div
              key={worker.id}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors',
                value === worker.id ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                isFull && 'opacity-60 cursor-not-allowed bg-muted'
              )}
              onClick={() => {
                if (!isFull) onSelect(worker.id);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {worker.name || '未命名'}
                    {isFull && <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-normal">已满载</span>}
                  </p>
                  <p className={cn("text-xs", isFull ? "text-destructive/80" : "text-muted-foreground")}>
                    当日负荷: {worker.currentTaskCount}/{worker.dailyTaskLimit} (上限)
                  </p>
                </div>
              </div>
              {value === worker.id && <Check className="text-primary h-4 w-4" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
