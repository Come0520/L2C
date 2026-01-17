"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
    Users,
    ShoppingCart,
    Ruler,
    Wrench,
    DollarSign,
    Clock,
    ArrowRight,
} from "lucide-react";

/**
 * 待办事项类型
 */
interface TodoItem {
    id: string;
    title: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    href: string;
    priority: "high" | "medium" | "low";
}

/**
 * 待办事项 Tab 内容组件
 * 聚合各模块的待处理事项
 */
export function TodoTab() {
    // 待办事项数据（后续可从 API 获取）
    const todoItems: TodoItem[] = [
        {
            id: "1",
            title: "待跟进线索",
            count: 8,
            icon: Users,
            iconColor: "text-blue-500",
            href: "/leads?status=PENDING_FOLLOWUP",
            priority: "high",
        },
        {
            id: "2",
            title: "待处理订单",
            count: 5,
            icon: ShoppingCart,
            iconColor: "text-amber-500",
            href: "/orders?status=PENDING",
            priority: "high",
        },
        {
            id: "3",
            title: "待安排测量",
            count: 3,
            icon: Ruler,
            iconColor: "text-purple-500",
            href: "/service/measurement?status=PENDING",
            priority: "medium",
        },
        {
            id: "4",
            title: "待安排安装",
            count: 2,
            icon: Wrench,
            iconColor: "text-cyan-500",
            href: "/service/installation?status=PENDING",
            priority: "medium",
        },
        {
            id: "5",
            title: "待收款账单",
            count: 6,
            icon: DollarSign,
            iconColor: "text-emerald-500",
            href: "/finance/ar?status=PENDING",
            priority: "medium",
        },
    ];

    const highPriorityItems = todoItems.filter((item) => item.priority === "high");
    const otherItems = todoItems.filter((item) => item.priority !== "high");

    return (
        <div className="space-y-6">
            {/* 紧急待办 */}
            {highPriorityItems.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-500" />
                        紧急待办
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        {highPriorityItems.map((item) => (
                            <TodoCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* 其他待办 */}
            {otherItems.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        其他待办
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {otherItems.map((item) => (
                            <TodoCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* 空状态 */}
            {todoItems.length === 0 && (
                <Card className="glass-liquid border-white/10">
                    <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>暂无待办事项</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/**
 * 待办卡片组件
 */
function TodoCard({ item }: { item: TodoItem }) {
    const Icon = item.icon;

    return (
        <Link href={item.href}>
            <Card className="glass-liquid border-white/10 hover:bg-white/10 dark:hover:bg-white/5 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                "bg-white/10 dark:bg-white/5"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", item.iconColor)} />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                                {item.count} 项待处理
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={item.priority === "high" ? "error" : "secondary"}
                            className="text-xs"
                        >
                            {item.count}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
