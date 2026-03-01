'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { format } from 'date-fns';
import { ArrowRight, Truck, Wrench, AlertTriangle, FileText, Link as LinkIcon } from 'lucide-react';
import { TicketDetail, LiabilityNotice } from '../types';

interface TraceabilityViewProps {
  ticket: TicketDetail;
}

const LIABLE_PARTY_LABELS: Record<string, string> = {
  COMPANY: '公司',
  FACTORY: '工厂',
  INSTALLER: '安装师傅',
  MEASURER: '测量师傅',
  LOGISTICS: '物流公司',
  CUSTOMER: '客户',
};

const REASON_CATEGORY_LABELS: Record<string, string> = {
  PRODUCTION_QUALITY: '生产质量',
  CONSTRUCTION_ERROR: '施工失误',
  DATA_ERROR: '数据错误',
  SALES_ERROR: '销售失误',
  LOGISTICS_ISSUE: '物流问题',
  CUSTOMER_REASON: '客户/人为原因',
};

export function TraceabilityView({ ticket }: TraceabilityViewProps) {
  const { order } = ticket;
  const purchaseOrders = order?.purchaseOrders || [];
  const installTasks = order?.installTasks || [];
  const liabilityNotices = ticket.notices || [];

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <LinkIcon className="h-5 w-5" /> 全链路溯源看板
      </h3>

      <div className="relative flex flex-col gap-6">
        {/* Connector Line (Virtual) -- Hard to do vertically with responsive, keeping simple cards stack */}

        {/* Stage 1: Order & Production */}
        <Card className="bg-muted/10 border-border glass-panel shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> 订单与交付源头
              </span>
              <Badge variant="outline">{order?.orderNo}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Purchase Orders */}
              <div className="space-y-2">
                <h4 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                  <Truck className="h-3 w-3" /> 关联采购/生产单
                </h4>
                {purchaseOrders.length === 0 ? (
                  <p className="text-muted-foreground pl-5 text-xs italic">无相关记录</p>
                ) : (
                  purchaseOrders.map(
                    (po: {
                      id: string;
                      poNo: string;
                      supplierName: string | null;
                      status: string | null;
                    }) => (
                      <div
                        key={po.id}
                        className="bg-card hover:bg-muted/10 flex items-center justify-between rounded border p-2 text-sm transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-800">{po.poNo}</div>
                          <div className="text-muted-foreground text-xs">{po.supplierName}</div>
                        </div>
                        <Badge variant="secondary" className="scale-90">
                          {po.status}
                        </Badge>
                      </div>
                    )
                  )
                )}
              </div>

              {/* Install Tasks */}
              <div className="space-y-2">
                <h4 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
                  <Wrench className="h-3 w-3" /> 关联安装/服务任务
                </h4>
                {installTasks.length === 0 ? (
                  <p className="text-muted-foreground pl-5 text-xs italic">无相关记录</p>
                ) : (
                  installTasks.map(
                    (task: {
                      id: string;
                      taskNo: string;
                      scheduledAt?: Date | string | null;
                      scheduledDate?: Date | string | null;
                      status: string;
                    }) => (
                      <div
                        key={task.id}
                        className="bg-card hover:bg-muted/10 flex items-center justify-between rounded border p-2 text-sm transition-colors"
                      >
                        <div>
                          <div className="font-medium text-slate-800">{task.taskNo}</div>
                          <div className="text-muted-foreground text-xs">
                            {task.scheduledAt || task.scheduledDate
                              ? format(
                                  new Date(
                                    (task.scheduledAt || task.scheduledDate) as string | Date
                                  ),
                                  'yyyy-MM-dd'
                                )
                              : '未排期'}
                          </div>
                        </div>
                        <Badge variant="secondary" className="scale-90">
                          {task.status}
                        </Badge>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="z-10 -my-2 flex justify-center">
          <div className="rounded-full border bg-slate-100 p-1">
            <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
          </div>
        </div>

        {/* Stage 2: After Sales Ticket */}
        <Card className="border-l-4 border-l-orange-500 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <span>售后工单处理</span>
              <Badge variant={ticket.status === 'CLOSED' ? 'secondary' : 'default'}>
                {ticket.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm font-medium text-slate-800">{ticket.description}</p>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <div className="rounded bg-slate-100 px-2 py-1">类型: {ticket.type}</div>
              <div className="rounded bg-slate-100 px-2 py-1">
                创建于: {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}
              </div>
              {ticket.installTaskId && (
                <div className="flex items-center gap-1 rounded border border-orange-100 bg-orange-50 px-2 py-1 text-orange-700">
                  <Wrench className="h-3 w-3" />
                  直源任务: {ticket.installTask?.taskNo}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {liabilityNotices.length > 0 && (
          <>
            <div className="z-10 -my-2 flex justify-center">
              <div className="rounded-full border border-red-100 bg-red-50 p-1">
                <ArrowRight className="h-4 w-4 rotate-90 text-red-400" />
              </div>
            </div>

            {/* Stage 3: Liability */}
            <Card className="border-l-4 border-l-red-500 bg-red-50/10 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-red-700">定责与赔付结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {liabilityNotices.map((notice: LiabilityNotice) => (
                  <div
                    key={notice.id}
                    className="bg-card flex flex-col items-start justify-between rounded border border-red-500/20 p-3 shadow-sm md:flex-row md:items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold">{notice.noticeNo}</span>
                        <Badge
                          variant="outline"
                          className="border-red-200 bg-red-50 text-xs text-red-700"
                        >
                          {REASON_CATEGORY_LABELS[notice.liabilityReasonCategory ?? ''] ||
                            notice.liabilityReasonCategory ||
                            '未分类'}
                        </Badge>
                      </div>
                      <p className="pl-6 text-sm text-slate-600">{notice.reason}</p>

                      <div className="mt-1 flex flex-wrap gap-2 pl-6">
                        <Badge variant="secondary" className="text-xs font-normal">
                          责任方:{' '}
                          {LIABLE_PARTY_LABELS[notice.liablePartyType] || notice.liablePartyType}
                        </Badge>
                        {notice.sourcePurchaseOrder && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 border-blue-200 bg-blue-50 text-xs font-normal text-blue-700"
                          >
                            <Truck className="h-3 w-3" />
                            溯源采购: {notice.sourcePurchaseOrder.poNo}
                          </Badge>
                        )}
                        {notice.sourceInstallTask && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 border-green-200 bg-green-50 text-xs font-normal text-green-700"
                          >
                            <Wrench className="h-3 w-3" />
                            溯源安装: {notice.sourceInstallTask.taskNo}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 pl-6 md:mt-0 md:pl-0 md:text-right">
                      <div className="font-bold text-red-600">¥ {notice.amount}</div>
                      <div className="text-muted-foreground text-xs">
                        {notice.status === 'CONFIRMED' ? '已确认' : '草稿/待确认'}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
