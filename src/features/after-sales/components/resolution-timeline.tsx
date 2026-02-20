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
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    const logs = data?.data || [];

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    处理轨迹
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {logs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">暂无轨迹记录</div>
                    ) : (
                        logs.map((log, index: number) => (
                            <div key={log.id} className="relative flex items-start gap-6">
                                <span className={`absolute left-0 grid place-content-center h-10 w-10 rounded-full border-4 border-white shadow-sm transition-colors duration-200 ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-500'}`}>
                                    <Clock className="h-5 w-5" />
                                </span>
                                <div className="flex-1 ml-10 pt-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                            {log.action === 'CREATE' ? '创建工单' :
                                                log.action === 'UPDATE' ? '更新状态' : log.action}
                                            {log.changedFields?.status && (
                                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                                    {log.changedFields.status}
                                                </span>
                                            )}
                                        </h4>
                                        <time className="text-xs text-slate-400 font-medium">
                                            {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                                        </time>
                                    </div>
                                    <div className="text-sm text-slate-600 space-y-2">
                                        {log.newValues?.resolution && (
                                            <p className="bg-slate-50 p-2 rounded-md border border-slate-100 italic">
                                                "{log.newValues.resolution}"
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
