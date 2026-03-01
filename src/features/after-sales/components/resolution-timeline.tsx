'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTicketLogs } from '../actions/ticket';
import { format } from 'date-fns';
import { Loader2, Activity, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface ResolutionTimelineProps {
  ticketId: string;
}

export function ResolutionTimeline({ ticketId }: ResolutionTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['after-sales-logs', ticketId],
    queryFn: () => getTicketLogs(ticketId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  const logs = data?.data || [];

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Activity className="text-primary h-5 w-5" />
          处理轨迹
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-linear-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {logs.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">暂无轨迹记录</div>
          ) : (
            logs.map((log, index: number) => (
              <div key={log.id} className="relative flex items-start gap-6">
                <span
                  className={`absolute left-0 grid h-10 w-10 place-content-center rounded-full border-4 border-white shadow-sm transition-colors duration-200 ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500'}`}
                >
                  <Clock className="h-5 w-5" />
                </span>
                <div className="ml-10 flex-1 pt-1">
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-semibold text-slate-900">
                      {log.action === 'CREATE'
                        ? '创建工单'
                        : log.action === 'UPDATE'
                          ? '更新状态'
                          : log.action}
                      {!!(log.changedFields as Record<string, unknown>)?.status && (
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                          {String((log.changedFields as Record<string, unknown>).status)}
                        </span>
                      )}
                    </h4>
                    <time className="text-xs font-medium text-slate-400">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                    </time>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    {!!(log.newValues as Record<string, unknown>)?.resolution && (
                      <p className="rounded-md border border-slate-100 bg-slate-50 p-2 italic">
                        "{String((log.newValues as Record<string, unknown>).resolution)}"
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      <span>操作人: {log.user?.name || '系统'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
