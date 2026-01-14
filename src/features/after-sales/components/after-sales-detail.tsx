'use client';

import { useQuery } from '@tanstack/react-query';
import { getTicketDetail } from '../actions';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LiabilityNoticeList } from './liability-notice-list';
import { LiabilityNoticeDialog } from './liability-notice-dialog'; // Fixed import path
import { format } from 'date-fns';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { TraceabilityView } from './traceability-view';
import { SLAStatus } from './sla-status';


interface AfterSalesDetailProps {
    ticketId: string;
}

export function AfterSalesDetail({ ticketId }: AfterSalesDetailProps) {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['after-sales-detail', ticketId],
        queryFn: () => getTicketDetail(ticketId),
    });

    if (isLoading) {
        return <div className="p-8 text-center flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data?.success || !data.data) {
        return <div className="p-8 text-center">工单不存在或加载失败</div>;
    }

    const ticket = data.data;

    // SLA Logic moved to SLAStatus component


    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        工单 {ticket.ticketNo}
                        <Badge variant={ticket.status === 'CLOSED' ? 'default' : 'secondary'}>
                            {ticket.status}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        创建时间: {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Actions can go here, e.g., Update Status, etc. */}
                </div>
            </div>

            {/* SLA Alert */}
            {/* SLA Alert - Moved to Sidebar */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>工单信息</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-muted-foreground block">关联客户</span>
                                <div>{ticket.customer?.name}</div>
                                <div className="text-sm text-muted-foreground">{ticket.customer?.phone}</div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">关联订单</span>
                                <div>{ticket.order?.orderNo}</div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">售后类型</span>
                                <div>{ticket.type}</div>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block">优先级</span>
                                <div>{ticket.priority}</div>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-muted-foreground block">问题描述</span>
                                <div className="bg-muted p-2 rounded mt-1">{ticket.description}</div>
                            </div>
                            <div className="col-span-2">
                                <span className="text-sm text-muted-foreground block">处理方案</span>
                                <div>{ticket.resolution || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="liability" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="traceability">全链路溯源</TabsTrigger>
                            <TabsTrigger value="liability">定责单</TabsTrigger>
                            <TabsTrigger value="tasks">上门任务</TabsTrigger>
                            <TabsTrigger value="purchase">补件采购</TabsTrigger>
                        </TabsList>
                        <TabsContent value="traceability" className="space-y-4">
                            <TraceabilityView ticket={ticket} />
                        </TabsContent>
                        <TabsContent value="liability" className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">定责管理</h3>
                                {/* Verify correct prop inheritance for trigger if used as child */}
                                <LiabilityNoticeDialog afterSalesId={ticket.id} onSuccess={refetch} />
                            </div>
                            <LiabilityNoticeList notices={ticket.notices || []} />
                        </TabsContent>
                        <TabsContent value="tasks" className="pt-4">
                            <div className="text-muted-foreground text-center py-8">暂无上门任务 (Coming Soon)</div>
                        </TabsContent>
                        <TabsContent value="purchase" className="pt-4">
                            <div className="text-muted-foreground text-center py-8">暂无采购记录 (Coming Soon)</div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Timeline / Sidebar (Placeholder) */}
                <div className="space-y-6">
                    <SLAStatus ticket={ticket} />

                    <Card>
                        <CardHeader>
                            <CardTitle>进度概览</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Simple Status Steps */}
                                {['PENDING', 'INVESTIGATING', 'PROCESSING', 'CLOSED'].map((step, i) => {
                                    const currentIdx = ['PENDING', 'INVESTIGATING', 'PROCESSING', 'CLOSED'].indexOf(ticket.status);
                                    const stepIdx = i;
                                    const isCompleted = stepIdx <= currentIdx;
                                    return (
                                        <div key={step} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                                            <span className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Add Images/Photos section if needed */}
                </div>
            </div>
        </div>
    );
}
