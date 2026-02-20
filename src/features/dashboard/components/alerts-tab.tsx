"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/shared/lib/fetcher";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronDown,
    RefreshCw,
    Loader2,
    Truck,
} from "lucide-react";
import type {
    AlertsResponse,
    AlertCategory,
    AlertItem,
    AlertSeverity,
} from "@/services/workbench.service";

// ============ 图标和颜色映射 ============

const SEVERITY_CONFIG: Record<AlertSeverity, {
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    badgeVariant: "error" | "secondary";
}> = {
    error: {
        icon: XCircle,
        colorClass: "text-red-500 bg-red-500/10",
        badgeVariant: "error",
    },
    warning: {
        icon: AlertTriangle,
        colorClass: "text-amber-500 bg-amber-500/10",
        badgeVariant: "error",
    },
    info: {
        icon: Bell,
        colorClass: "text-blue-500 bg-blue-500/10",
        badgeVariant: "secondary",
    },
};

const CATEGORY_ICON: Record<AlertCategory, React.ComponentType<{ className?: string }>> = {
    LEAD_OVERDUE: Clock,
    SLA_OVERDUE: XCircle,
    DELIVERY_DELAY: Truck,
    PAYMENT_OVERDUE: AlertTriangle,
};

// ============ 主组件 ============

/**
 * 报警中心 Tab 内容组件
 * 从 API 获取真实报警数据，使用可折叠列表展示
 */
export function AlertsTab() {
    const { data, error, isLoading, mutate } = useSWR<AlertsResponse>("/api/workbench/alerts", fetcher);
    const [expandedCategories, setExpandedCategories] = useState<Set<AlertCategory>>(new Set());

    /** 切换分类展开/收起 */
    const toggleCategory = (category: AlertCategory) => {
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

    // 加载状态
    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载报警信息...</span>
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <Card className="glass-liquid border-white/10">
                <CardContent className="py-12 text-center">
                    <p className="text-destructive mb-4">{error.message || "获取报警信息失败"}</p>
                    <Button variant="outline" onClick={() => mutate()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const totalCount = data.items.length;

    return (
        <div className="space-y-4">
            {/* 顶部概览 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">
                        共 <span className="font-semibold text-foreground">{totalCount}</span> 条报警
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => mutate()}
                    disabled={isLoading}
                    className="text-xs"
                >
                    <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                    刷新
                </Button>
            </div>

            {/* 分类折叠列表 */}
            {data.categories.map(cat => {
                const isExpanded = expandedCategories.has(cat.category);
                const sevConfig = SEVERITY_CONFIG[cat.severity];
                const CatIcon = CATEGORY_ICON[cat.category] || AlertTriangle;
                const itemsInCategory = data.items.filter(i => i.category === cat.category);

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
                                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", sevConfig.colorClass)}>
                                    <CatIcon className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-foreground">{cat.label}</span>
                                <Badge variant={sevConfig.badgeVariant} className="text-xs">
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

                        {/* 展开内容 — 报警列表 */}
                        {isExpanded && (
                            <div className="border-t border-white/10 bg-white/2 dark:bg-black/10">
                                {itemsInCategory.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        暂无此类报警
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {itemsInCategory.map(item => (
                                            <AlertRow key={item.id} item={item} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 空状态 */}
            {totalCount === 0 && (
                <Card className="glass-liquid border-white/10">
                    <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-emerald-500" />
                            <p>暂无报警</p>
                            <p className="text-sm mt-1">一切运行正常 ✅</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ============ 报警项组件 ============

function AlertRow({ item }: { item: AlertItem }) {
    const sevConfig = SEVERITY_CONFIG[item.severity];
    const Icon = sevConfig.icon;

    return (
        <div className="flex items-start gap-4 p-4 hover:bg-white/5 transition-colors">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", sevConfig.colorClass)}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 mt-1">
                {item.createdAt ? formatRelativeTime(new Date(item.createdAt)) : "-"}
            </span>
        </div>
    );
}

// ============ 工具函数 ============

/** 格式化相对时间 */
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return date.toLocaleDateString("zh-CN");
}
