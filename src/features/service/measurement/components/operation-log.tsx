'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/shared/lib/utils';

interface OperationLogEntry {
  id: string;
  action: string;
  detail?: string;
  operatorName?: string;
  createdAt: string | Date;
}

interface OperationLogProps {
  logs: OperationLogEntry[];
  className?: string;
}

/**
 * 操作动作标签映射
 */
const ACTION_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  CREATE: { label: '创建', variant: 'secondary' },
  DISPATCH: { label: '派单', variant: 'default' },
  ACCEPT: { label: '接单', variant: 'default' },
  CHECK_IN: { label: '签到', variant: 'default' },
  SUBMIT: { label: '提交', variant: 'default' },
  CONFIRM: { label: '确认', variant: 'default' },
  REJECT: { label: '驳回', variant: 'destructive' },
  CANCEL: { label: '取消', variant: 'destructive' },
  SPLIT: { label: '拆单', variant: 'outline' },
  FEE_WAIVER: { label: '费用豁免', variant: 'outline' },
};

/**
 * 操作日志组件
 *
 * 用于详情页展示任务操作历史和驳回记录
 */
export function OperationLog({ logs, className }: OperationLogProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">操作日志</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-4 text-center text-sm">暂无操作记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">操作日志</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* 时间线 */}
          <div className="bg-border absolute top-2 bottom-2 left-[7px] w-px" />

          <div className="space-y-4">
            {logs.map((log, index) => {
              const actionConfig = ACTION_LABELS[log.action] || {
                label: log.action,
                variant: 'outline' as const,
              };
              const isReject = log.action === 'REJECT';

              return (
                <div key={log.id} className="relative pl-6">
                  {/* 时间线节点 */}
                  <div
                    className={cn(
                      'bg-background absolute top-1 left-0 h-4 w-4 rounded-full border-2',
                      isReject ? 'border-destructive' : 'border-primary'
                    )}
                  />

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionConfig.variant}>{actionConfig.label}</Badge>
                      <span className="text-muted-foreground text-xs">
                        {log.operatorName || '系统'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>

                    {log.detail && (
                      <p
                        className={cn(
                          'text-sm',
                          isReject ? 'text-destructive' : 'text-muted-foreground'
                        )}
                      >
                        {log.detail}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default OperationLog;
