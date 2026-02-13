'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { format } from "date-fns";
import { ArrowRight, Truck, Wrench, AlertTriangle, FileText, Link as LinkIcon } from "lucide-react";


interface TraceabilityViewProps {
    ticket: any; // Using loose type for flexibility with deep relations, can be typed strictly if needed
}

const LIABLE_PARTY_LABELS: Record<string, string> = {
    'COMPANY': '公司',
    'FACTORY': '工厂',
    'INSTALLER': '安装师傅',
    'MEASURER': '测量师傅',
    'LOGISTICS': '物流公司',
    'CUSTOMER': '客户',
};

const REASON_CATEGORY_LABELS: Record<string, string> = {
    'PRODUCTION_QUALITY': '生产质量',
    'CONSTRUCTION_ERROR': '施工失误',
    'DATA_ERROR': '数据错误',
    'SALES_ERROR': '销售失误',
    'LOGISTICS_ISSUE': '物流问题',
    'CUSTOMER_REASON': '客户/人为原因',
};

export function TraceabilityView({ ticket }: TraceabilityViewProps) {
    const { order } = ticket;
    const purchaseOrders = order?.purchaseOrders || [];
    const installTasks = order?.installTasks || [];
    const liabilityNotices = ticket.notices || [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <LinkIcon className="h-5 w-5" /> 全链路溯源看板
            </h3>

            <div className="flex flex-col gap-6 relative">
                {/* Connector Line (Virtual) -- Hard to do vertically with responsive, keeping simple cards stack */}

                {/* Stage 1: Order & Production */}
                <Card className="bg-muted/10 border-border shadow-sm glass-panel">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex justify-between items-center text-slate-700">
                            <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4" /> 订单与交付源头
                            </span>
                            <Badge variant="outline">{order?.orderNo}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Purchase Orders */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <Truck className="h-3 w-3" /> 关联采购/生产单
                                </h4>
                                {purchaseOrders.length === 0 ? <p className="text-xs text-muted-foreground italic pl-5">无相关记录</p> :
                                    purchaseOrders.map((po: any) => (
                                        <div key={po.id} className="border p-2 rounded text-sm bg-card hover:bg-muted/10 transition-colors flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-slate-800">{po.poNo}</div>
                                                <div className="text-xs text-muted-foreground">{po.supplierName}</div>
                                            </div>
                                            <Badge variant="secondary" className="scale-90">{po.status}</Badge>
                                        </div>
                                    ))
                                }
                            </div>

                            {/* Install Tasks */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                                    <Wrench className="h-3 w-3" /> 关联安装/服务任务
                                </h4>
                                {installTasks.length === 0 ? <p className="text-xs text-muted-foreground italic pl-5">无相关记录</p> :
                                    installTasks.map((task: any) => (
                                        <div key={task.id} className="border p-2 rounded text-sm bg-card hover:bg-muted/10 transition-colors flex justify-between items-center">
                                            <div>
                                                <div className="font-medium text-slate-800">{task.taskNo}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {task.scheduledAt ? format(new Date(task.scheduledAt), 'yyyy-MM-dd') : '未排期'}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="scale-90">{task.status}</Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center -my-2 z-10">
                    <div className="bg-slate-100 p-1 rounded-full border">
                        <ArrowRight className="h-4 w-4 text-slate-400 rotate-90" />
                    </div>
                </div>

                {/* Stage 2: After Sales Ticket */}
                <Card className="border-l-4 border-l-orange-500 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex justify-between items-center">
                            <span>售后工单处理</span>
                            <Badge variant={ticket.status === 'CLOSED' ? 'secondary' : 'default'} >{ticket.status}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium text-slate-800 mb-2">{ticket.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <div className="bg-slate-100 px-2 py-1 rounded">类型: {ticket.type}</div>
                            <div className="bg-slate-100 px-2 py-1 rounded">创建于: {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}</div>
                            {ticket.installTaskId && (
                                <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100 flex items-center gap-1">
                                    <Wrench className="h-3 w-3" />
                                    直源任务: {ticket.installTask?.taskNo}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {liabilityNotices.length > 0 && (
                    <>
                        <div className="flex justify-center -my-2 z-10">
                            <div className="bg-red-50 p-1 rounded-full border border-red-100">
                                <ArrowRight className="h-4 w-4 text-red-400 rotate-90" />
                            </div>
                        </div>

                        {/* Stage 3: Liability */}
                        <Card className="border-l-4 border-l-red-500 bg-red-50/10 shadow-md">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium text-red-700">定责与赔付结果</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {liabilityNotices.map((notice: any) => (
                                    <div key={notice.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-3 rounded border border-red-500/20 shadow-sm">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                <span className="font-semibold text-sm">{notice.noticeNo}</span>
                                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                    {REASON_CATEGORY_LABELS[notice.liabilityReasonCategory] || notice.liabilityReasonCategory || '未分类'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-600 pl-6">{notice.reason}</p>

                                            <div className="flex flex-wrap gap-2 pl-6 mt-1">
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    责任方: {LIABLE_PARTY_LABELS[notice.liablePartyType] || notice.liablePartyType}
                                                </Badge>
                                                {notice.sourcePurchaseOrder && (
                                                    <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                                                        <Truck className="h-3 w-3" />
                                                        溯源采购: {notice.sourcePurchaseOrder.poNo}
                                                    </Badge>
                                                )}
                                                {notice.sourceInstallTask && (
                                                    <Badge variant="outline" className="text-xs font-normal bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                                                        <Wrench className="h-3 w-3" />
                                                        溯源安装: {notice.sourceInstallTask.taskNo}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-2 md:mt-0 md:text-right pl-6 md:pl-0">
                                            <div className="font-bold text-red-600">¥ {notice.amount}</div>
                                            <div className="text-xs text-muted-foreground">{notice.status === 'CONFIRMED' ? '已确认' : '草稿/待确认'}</div>
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
