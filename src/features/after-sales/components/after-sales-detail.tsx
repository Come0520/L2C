'use client';

import { useQuery } from '@tanstack/react-query';
import { getTicketDetail } from '../actions';
import { TicketDetail } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { LiabilityNoticeList } from './liability-notice-list';
import { LiabilityNoticeDialog } from './liability-notice-dialog'; // Fixed import path
import { format } from 'date-fns';
import { Badge } from '@/shared/ui/badge';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ResolutionTimeline } from './resolution-timeline';
import { AddResolutionDialog } from './add-resolution-dialog';

// P1 FIX (AS-12): 针对详情页非核心组件进行懒加载优化
const TraceabilityView = dynamic(
  () => import('./traceability-view').then((mod) => mod.TraceabilityView),
  {
    loading: () => <div className="bg-muted h-40 animate-pulse rounded-md" />,
  }
);

const SLAStatus = dynamic(() => import('./sla-status').then((mod) => mod.SLAStatus), {
  loading: () => <div className="bg-muted h-20 animate-pulse rounded-md" />,
});

interface AfterSalesDetailProps {
  ticketId: string;
  initialData?: Awaited<ReturnType<typeof getTicketDetail>>;
}

export function AfterSalesDetail({ ticketId, initialData }: AfterSalesDetailProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['after-sales-detail', ticketId],
    queryFn: () => getTicketDetail(ticketId),
    initialData,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return <div className="p-8 text-center">工单不存在或加载失败</div>;
  }

  const ticket = data.data as unknown as TicketDetail;

  // SLA Logic moved to SLAStatus component

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      {/* Header / Summary */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
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
          <AddResolutionDialog
            ticketId={ticket.id}
            currentStatus={ticket.status}
            onSuccess={refetch}
          />
        </div>
      </div>

      {/* SLA Alert */}
      {/* SLA Alert - Moved to Sidebar */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: Info */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>工单信息</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block text-sm">关联客户</span>
                <div>{ticket.customer?.name}</div>
                <div className="text-muted-foreground text-sm">{ticket.customer?.phone}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">关联订单</span>
                <div>{ticket.order?.orderNo}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">售后类型</span>
                <div>{ticket.type}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-sm">优先级</span>
                <div>{ticket.priority}</div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block text-sm">问题描述</span>
                <div className="bg-muted mt-1 rounded p-2">{ticket.description}</div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block text-sm">处理方案</span>
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">定责管理</h3>
                {/* Verify correct prop inheritance for trigger if used as child */}
                <LiabilityNoticeDialog afterSalesId={ticket.id} onSuccess={refetch} />
              </div>
              <LiabilityNoticeList notices={ticket.notices || []} />
            </TabsContent>
            <TabsContent value="tasks" className="pt-4">
              <div className="text-muted-foreground py-8 text-center">
                暂无上门任务 (Coming Soon)
              </div>
            </TabsContent>
            <TabsContent value="purchase" className="pt-4">
              <div className="text-muted-foreground py-8 text-center">
                暂无采购记录 (Coming Soon)
              </div>
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
              <ResolutionTimeline ticketId={ticket.id} />
            </CardContent>
          </Card>

          {/* Add Images/Photos section if needed */}
        </div>
      </div>
    </div>
  );
}
