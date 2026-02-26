import React from 'react';
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Phone from 'lucide-react/dist/esm/icons/phone';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import type {
    TodosResponse,
    TodoCategory,
    LeadTodoItem,
    OrderTodoItem,
    POTodoItem,
    ProductionTodoItem,
    AfterSalesTodItem,
    ApprovalTodoItem,
} from "@/services/workbench.service";
import { addLeadFollowup, convertLead } from "@/features/leads/actions";
import { updateOrderStatus } from "@/features/orders/actions/mutations";

export const TodoCategoryTable = React.memo(function TodoCategoryTable({
    category,
    data,
    actionLoading,
    onAction,
}: {
    category: TodoCategory;
    data: TodosResponse;
    actionLoading: string | null;
    onAction: (fn: () => Promise<unknown>, id: string, category: TodoCategory) => void;
}) {
    switch (category) {
        case "LEAD":
            return <LeadTable items={data.leads || []} actionLoading={actionLoading} onAction={onAction} />;
        case "ORDER":
            return <OrderTable items={data.orders || []} actionLoading={actionLoading} onAction={onAction} />;
        case "PO":
            return <POTable items={data.purchaseOrders || []} />;
        case "PRODUCTION":
            return <ProductionTable items={data.productionTasks || []} />;
        case "AFTER_SALES":
            return <AfterSalesTable items={data.afterSales || []} />;
        case "APPROVAL":
            return <ApprovalTable items={data.approvalTodos || []} />;
        default:
            return null;
    }
});

const LeadTable = React.memo(function LeadTable({
    items,
    actionLoading,
    onAction,
}: {
    items: LeadTodoItem[];
    actionLoading: string | null;
    onAction: (fn: () => Promise<unknown>, id: string, category: TodoCategory) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3 font-medium">线索编号</th>
                        <th className="text-left p-3 font-medium">客户名称</th>
                        <th className="text-left p-3 font-medium">电话</th>
                        <th className="text-left p-3 font-medium">意向等级</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                        <th className="text-right p-3 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-xs">{item.leadNo}</td>
                            <td className="p-3 font-medium">{item.customerName}</td>
                            <td className="p-3">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {item.customerPhone}
                                </span>
                            </td>
                            <td className="p-3">
                                <IntentionBadge level={item.intentionLevel} />
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString("zh-CN") : "-"}
                            </td>
                            <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        disabled={actionLoading === item.id}
                                        onClick={() =>
                                            onAction(
                                                () => addLeadFollowup({
                                                    leadId: item.id,
                                                    type: 'PHONE_CALL',
                                                    content: '已在工作台跟进',
                                                }),
                                                item.id,
                                                'LEAD'
                                            )
                                        }
                                    >
                                        {actionLoading === item.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            "添加跟进"
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-7"
                                        disabled={actionLoading === `convert-${item.id}`}
                                        onClick={() =>
                                            onAction(
                                                () => convertLead({ leadId: item.id }),
                                                item.id,
                                                'LEAD'
                                            )
                                        }
                                    >
                                        <ArrowRight className="h-3 w-3 mr-1" />
                                        转化
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

const OrderTable = React.memo(function OrderTable({
    items,
    actionLoading,
    onAction,
}: {
    items: OrderTodoItem[];
    actionLoading: string | null;
    onAction: (fn: () => Promise<unknown>, id: string, category: TodoCategory) => void;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3 font-medium">订单号</th>
                        <th className="text-left p-3 font-medium">客户名称</th>
                        <th className="text-left p-3 font-medium">金额</th>
                        <th className="text-left p-3 font-medium">状态</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                        <th className="text-right p-3 font-medium">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-xs">{item.orderNo}</td>
                            <td className="p-3 font-medium">{item.customerName || "-"}</td>
                            <td className="p-3 text-emerald-500 font-medium">
                                {item.totalAmount ? `¥${Number(item.totalAmount).toLocaleString()}` : "-"}
                            </td>
                            <td className="p-3">
                                <Badge variant="secondary" className="text-xs">
                                    {item.status || "草稿"}
                                </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString("zh-CN") : "-"}
                            </td>
                            <td className="p-3 text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    disabled={actionLoading === `lock-${item.id}`}
                                    onClick={() =>
                                        onAction(
                                            () => updateOrderStatus({
                                                id: item.id,
                                                status: 'CONFIRMED',
                                                version: (item as unknown as { version: number }).version || 0,
                                            }),
                                            item.id,
                                            'ORDER'
                                        )
                                    }
                                >
                                    {actionLoading === `lock-${item.id}` ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        "锁定订单"
                                    )}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

function POTable({ items }: { items: POTodoItem[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3 font-medium">采购单号</th>
                        <th className="text-left p-3 font-medium">供应商</th>
                        <th className="text-left p-3 font-medium">金额</th>
                        <th className="text-left p-3 font-medium">状态</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-xs">{item.poNo}</td>
                            <td className="p-3 font-medium">{item.supplierName || "-"}</td>
                            <td className="p-3 text-emerald-500 font-medium">
                                {item.totalAmount ? `¥${Number(item.totalAmount).toLocaleString()}` : "-"}
                            </td>
                            <td className="p-3">
                                <Badge variant="secondary" className="text-xs">草稿</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString("zh-CN") : "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ProductionTable({ items }: { items: ProductionTodoItem[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3 font-medium">任务编号</th>
                        <th className="text-left p-3 font-medium">车间</th>
                        <th className="text-left p-3 font-medium">状态</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-xs">{item.taskNo}</td>
                            <td className="p-3 font-medium">{item.workshop || "-"}</td>
                            <td className="p-3">
                                <Badge variant="secondary" className="text-xs">待处理</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString("zh-CN") : "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function AfterSalesTable({ items }: { items: AfterSalesTodItem[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3 font-medium">工单号</th>
                        <th className="text-left p-3 font-medium">类型</th>
                        <th className="text-left p-3 font-medium">优先级</th>
                        <th className="text-left p-3 font-medium">描述</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-xs">{item.ticketNo}</td>
                            <td className="p-3 font-medium">{item.type}</td>
                            <td className="p-3">
                                <PriorityBadge priority={item.priority} />
                            </td>
                            <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">
                                {item.description || "-"}
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** 审批待办表格 */
function ApprovalTable({ items }: { items: ApprovalTodoItem[] }) {
    /** 业务类型中文映射 */
    const entityTypeLabel: Record<string, string> = {
        QUOTE: '报价单',
        ORDER: '订单',
        PO: '采购单',
        PRICE_ADJUST: '调价申请',
        REFUND: '退款申请',
        FEE_WAIVER: '费用减免',
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left p-3 font-medium">审批 ID</th>
                        <th className="text-left p-3 font-medium">业务类型</th>
                        <th className="text-left p-3 font-medium">状态</th>
                        <th className="text-left p-3 font-medium">超时时间</th>
                        <th className="text-left p-3 font-medium">创建时间</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-xs">{item.approvalId?.slice(0, 8) ?? '-'}...</td>
                            <td className="p-3 font-medium">
                                {entityTypeLabel[item.entityType || ''] || item.entityType || '-'}
                            </td>
                            <td className="p-3">
                                <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-500">待审批</Badge>
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {item.timeoutAt ? new Date(item.timeoutAt).toLocaleString('zh-CN') : '-'}
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


function IntentionBadge({ level }: { level: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        HIGH: { label: "高", className: "bg-red-500/10 text-red-500" },
        MEDIUM: { label: "中", className: "bg-amber-500/10 text-amber-500" },
        LOW: { label: "低", className: "bg-slate-500/10 text-slate-500" },
    };
    const c = config[level || ""] || { label: level || "-", className: "bg-slate-500/10 text-slate-500" };
    return <Badge variant="secondary" className={cn("text-xs", c.className)}>{c.label}</Badge>;
}

function PriorityBadge({ priority }: { priority: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        HIGH: { label: "高", className: "bg-red-500/10 text-red-500" },
        MEDIUM: { label: "中", className: "bg-amber-500/10 text-amber-500" },
        LOW: { label: "低", className: "bg-slate-500/10 text-slate-500" },
        URGENT: { label: "紧急", className: "bg-red-600/10 text-red-600" },
    };
    const c = config[priority || ""] || { label: priority || "-", className: "bg-slate-500/10 text-slate-500" };
    return <Badge variant="secondary" className={cn("text-xs", c.className)}>{c.label}</Badge>;
}
