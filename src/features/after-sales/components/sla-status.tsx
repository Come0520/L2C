'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

import { format, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

import { TicketDetail } from "../types";

interface SLAStatusProps {
    ticket: TicketDetail;
}

interface SLAStatusType {
    status: 'unset' | 'ok' | 'overdue' | 'urgent' | 'warning' | 'normal';
    color: string;
    text: string;
}

export function SLAStatus({ ticket }: SLAStatusProps) {
    const now = new Date();

    // Deadlines
    const responseDeadline = ticket.slaResponseDeadline ? new Date(ticket.slaResponseDeadline) : null;
    const visitDeadline = ticket.slaVisitDeadline ? new Date(ticket.slaVisitDeadline) : null;
    const closureDeadline = ticket.slaClosureDeadline ? new Date(ticket.slaClosureDeadline) : null;

    // Helper to get status color and text
    const getDeadlineStatus = (deadline: Date | null, isCompleted: boolean): SLAStatusType => {
        if (!deadline) return { status: 'unset', color: 'bg-gray-200', text: '未设置' };
        if (isCompleted) return { status: 'ok', color: 'bg-green-500', text: '已达成' };

        const hoursLeft = differenceInHours(deadline, now);

        if (isPast(deadline)) return { status: 'overdue', color: 'bg-red-600', text: '已逾期' };
        if (hoursLeft < 4) return { status: 'urgent', color: 'bg-red-500', text: '即将逾期 (<4h)' }; // Red Card
        if (hoursLeft < 24) return { status: 'warning', color: 'bg-yellow-500', text: '警告 (<24h)' }; // Yellow Card

        return { status: 'normal', color: 'bg-blue-500', text: '正常' };
    };

    // Determine completion (Logic needs to be bound to actual ticket status/timestamps. 
    // Assuming we might have `respondedAt`, `visitedAt` etc. logic or simplified check)
    // For now, simple mapping based on ticket status.
    const isResponded = ticket.status !== 'PENDING';
    const isVisited = ['PROCESSING', 'PENDING_VERIFY', 'CLOSED'].includes(ticket.status);
    const isClosed = ticket.status === 'CLOSED';

    const responseStatus = getDeadlineStatus(responseDeadline, isResponded);
    const visitStatus = getDeadlineStatus(visitDeadline, isVisited);
    const closureStatus = getDeadlineStatus(closureDeadline, isClosed);

    // Current Active Deadline for Main Display
    let activeDeadline = null;
    let activeLabel = '';
    let activeStatus: SLAStatusType | null = null;

    if (!isResponded && responseDeadline) {
        activeDeadline = responseDeadline;
        activeLabel = '响应倒计时';
        activeStatus = responseStatus;
    } else if (!isVisited && visitDeadline) {
        activeDeadline = visitDeadline;
        activeLabel = '上门倒计时';
        activeStatus = visitStatus;
    } else if (!isClosed && closureDeadline) {
        activeDeadline = closureDeadline;
        activeLabel = '闭环倒计时';
        activeStatus = closureStatus;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <Clock className="h-5 w-5" /> SLA 监控
                    </span>
                    {activeStatus && (activeStatus.status === 'urgent' || activeStatus.status === 'overdue') && (
                        <Badge className="bg-destructive animate-pulse text-destructive-foreground">
                            <AlertCircle className="h-3 w-3 mr-1" /> 此单急需处理
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main Countdown if active */}
                {activeDeadline && activeStatus && (
                    <div className={cn("p-4 rounded-lg flex justify-between items-center border",
                        activeStatus.status === 'overdue' ? "glass-alert-error" :
                            activeStatus.status === 'urgent' ? "glass-alert-error" :
                                activeStatus.status === 'warning' ? "glass-alert-warning" :
                                    "glass-alert-info"
                    )}>
                        <div>
                            <div className="text-sm font-medium text-slate-600">{activeLabel}</div>
                            <div className={cn("text-2xl font-bold font-mono",
                                activeStatus.status === 'overdue' ? "text-red-700" :
                                    activeStatus.status === 'urgent' ? "text-red-600" :
                                        "text-slate-800"
                            )}>
                                {activeStatus.status === 'overdue'
                                    ? `逾期 ${Math.abs(differenceInHours(activeDeadline, now))} 小时`
                                    : `${differenceInHours(activeDeadline, now)}h ${differenceInMinutes(activeDeadline, now) % 60}m`
                                }
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">截止时间</div>
                            <div className="font-medium">{format(activeDeadline, 'MM-dd HH:mm')}</div>
                        </div>
                    </div>
                )}

                {/* Timeline Steps */}
                <div className="space-y-4">
                    <SLAStep label="1. 客服响应" deadline={responseDeadline} status={responseStatus} isCompleted={isResponded} />
                    <SLAStep label="2. 上门/处理" deadline={visitDeadline} status={visitStatus} isCompleted={isVisited} />
                    <SLAStep label="3. 完结闭环" deadline={closureDeadline} status={closureStatus} isCompleted={isClosed} />
                </div>
            </CardContent>
        </Card>
    );
}

function SLAStep({ label, deadline, status, isCompleted }: { label: string, deadline: Date | null, status: SLAStatusType, isCompleted: boolean }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <div className={cn("flex items-center justify-center w-6 h-6 rounded-full border shrink-0",
                isCompleted ? "glass-step-completed" : "glass-step-inactive")}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3 w-3" />}
            </div>

            <div className="flex-1">
                <div className="flex justify-between mb-1">
                    <span className={cn("font-medium", isCompleted ? "text-slate-800" : "text-slate-500")}>{label}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded", status.color, "text-white")}>{status.text}</span>
                </div>
                {deadline ? (
                    <div className="text-xs text-muted-foreground">
                        SLA截止: {format(deadline, 'MM-dd HH:mm')}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground italic">未设置SLA</div>
                )}
            </div>
        </div>
    );
}
