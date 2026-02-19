"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
    Users,
    ShoppingCart,
    Clipboard,
    Factory,
    Wrench,
    Clock,
    ChevronDown,
    RefreshCw,
    Loader2,
    Phone,
    ArrowRight,
} from "lucide-react";
import type {
    TodosResponse,
    TodoCategory,
    LeadTodoItem,
    OrderTodoItem,
    POTodoItem,
    ProductionTodoItem,
    AfterSalesTodItem,
} from "@/services/workbench.service";
import { addLeadFollowup, convertLead } from "@/features/leads/actions";
import { updateOrderStatus } from "@/features/orders/actions/mutations";
import { toast } from "sonner";

// ============ 图标映射 ============

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Users,
    ShoppingCart,
    Clipboard,
    Factory,
    Wrench,
};

const COLOR_MAP: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    cyan: "text-cyan-500 bg-cyan-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
};

// ============ 主组件 ============

/**
 * 待办事项 Tab 内容组件
 * 从 API 获取真实数据，使用可折叠列表展示，支持内联操作
 */
export function TodoTab() {
    const [data, setData] = useState<TodosResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<TodoCategory>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    /** 获取待办数据 */
    const fetchTodos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/workbench/todos");
            if (!response.ok) throw new Error("获取待办事项失败");
            const result: TodosResponse = await response.json();
            setData(result);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "未知错误");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    /** 切换分类展开/收起 */
    const toggleCategory = (category: TodoCategory) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    /** 执行操作后刷新列表 */
    const handleAction = async (actionFn: () => Promise<{ success: boolean; error?: string; data?: any } | any>, itemId: string) => {
        setActionLoading(itemId);
        try {
            const res = await actionFn();
            // 如果返回了标准化响应格式且 success 为 false，则抛出错误
            if (res && typeof res === 'object' && 'success' in res && res.success === false) {
                throw new Error(res.error || "操作失败");
            }
            toast.success("操作成功");
            await fetchTodos();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "操作失败");
        } finally {
            setActionLoading(null);
        }
    };

    // 加载状态
    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载待办事项...</span>
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <Card className="glass-liquid border-white/10">
                <CardContent className="py-12 text-center">
                    <p className="text-destructive mb-4">{error}</p>
                    <Button variant="outline" onClick={fetchTodos}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const totalCount = data.categories.reduce((sum, c) => sum + c.count, 0);

    return (
        <div className="space-y-4">
            {/* 顶部概览 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        共 <span className="font-semibold text-foreground">{totalCount}</span> 项待办
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchTodos}
                    disabled={loading}
                    className="text-xs"
                >
                    <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
                    刷新
                </Button>
            </div>

            {/* 分类折叠列表 */}
            {data.categories.map(cat => {
                const isExpanded = expandedCategories.has(cat.category);
                const IconComp = ICON_MAP[cat.icon] || Clock;
                const colorClass = COLOR_MAP[cat.color] || COLOR_MAP.blue;

                return (
                    <div key={cat.category} className="rounded-xl overflow-hidden border border-white/10">
                        {/* 折叠触发器 */}
                        <button
                            onClick={() => toggleCategory(cat.category)}
                            className={cn(
                                "w-full flex items-center justify-between p-4 transition-all",
                                "hover:bg-white/5 dark:hover:bg-white/3",
                                isExpanded ? "bg-white/5 dark:bg-white/3" : "bg-transparent"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", colorClass)}>
                                    <IconComp className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-foreground">{cat.label}</span>
                                <Badge
                                    variant={cat.count > 0 ? "error" : "secondary"}
                                    className="text-xs"
                                >
                                    {cat.count}
                                </Badge>
                            </div>
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                    isExpanded && "rotate-180"
                                )}
                            />
                        </button>

                        {/* 展开内容 — 表格 */}
                        {isExpanded && (
                            <div className="border-t border-white/10 bg-white/2 dark:bg-black/10">
                                {cat.count === 0 ? (
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        暂无待办
                                    </div>
                                ) : (
                                    <TodoCategoryTable
                                        category={cat.category}
                                        data={data}
                                        actionLoading={actionLoading}
                                        onAction={handleAction}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 全部为空状态 */}
            {totalCount === 0 && (
                <Card className="glass-liquid border-white/10">
                    <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>暂无待办事项</p>
                            <p className="text-sm mt-1">所有任务已处理完毕 🎉</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ============ 分类表格路由 ============

function TodoCategoryTable({
    category,
    data,
    actionLoading,
    onAction,
}: {
    category: TodoCategory;
    data: TodosResponse;
    actionLoading: string | null;
    onAction: (fn: () => Promise<unknown>, id: string) => void;
}) {
    switch (category) {
        case "LEAD":
            return <LeadTable items={data.leads} actionLoading={actionLoading} onAction={onAction} />;
        case "ORDER":
            return <OrderTable items={data.orders} actionLoading={actionLoading} onAction={onAction} />;
        case "PO":
            return <POTable items={data.purchaseOrders} />;
        case "PRODUCTION":
            return <ProductionTable items={data.productionTasks} />;
        case "AFTER_SALES":
            return <AfterSalesTable items={data.afterSales} />;
        default:
            return null;
    }
}

// ============ 线索待办表格 ============

function LeadTable({
    items,
    actionLoading,
    onAction,
}: {
    items: LeadTodoItem[];
    actionLoading: string | null;
    onAction: (fn: () => Promise<unknown>, id: string) => void;
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
                                                item.id
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
                                                `convert-${item.id}`
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
}

// ============ 订单待办表格 ============

function OrderTable({
    items,
    actionLoading,
    onAction,
}: {
    items: OrderTodoItem[];
    actionLoading: string | null;
    onAction: (fn: () => Promise<unknown>, id: string) => void;
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
                                            }),
                                            `lock-${item.id}`
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
}

// ============ 采购单表格 ============

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

// ============ 生产任务表格 ============

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

// ============ 售后工单表格 ============

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

// ============ 辅助组件 ============

/** 意向等级徽章 */
function IntentionBadge({ level }: { level: string | null }) {
    const config: Record<string, { label: string; className: string }> = {
        HIGH: { label: "高", className: "bg-red-500/10 text-red-500" },
        MEDIUM: { label: "中", className: "bg-amber-500/10 text-amber-500" },
        LOW: { label: "低", className: "bg-slate-500/10 text-slate-500" },
    };
    const c = config[level || ""] || { label: level || "-", className: "bg-slate-500/10 text-slate-500" };
    return <Badge variant="secondary" className={cn("text-xs", c.className)}>{c.label}</Badge>;
}

/** 优先级徽章 */
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
