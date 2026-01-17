"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    XCircle,
    Info,
    ArrowRight,
} from "lucide-react";

/**
 * 报警类型
 */
type AlertType = "warning" | "error" | "info" | "success";

/**
 * 报警项接口
 */
interface AlertItem {
    id: string;
    title: string;
    description: string;
    type: AlertType;
    time: string;
    href?: string;
}

/**
 * 报警中心 Tab 内容组件
 * 展示 SLA 超时、系统通知、审批待办等
 */
export function AlertsTab() {
    // 报警数据（后续可从 API 获取）
    const alerts: AlertItem[] = [
        {
            id: "1",
            title: "线索跟进超时",
            description: "3 条线索超过 48 小时未跟进",
            type: "warning",
            time: "10 分钟前",
            href: "/leads?filter=overdue",
        },
        {
            id: "2",
            title: "订单交付延迟",
            description: "订单 #2024-0156 已超过预计交付时间",
            type: "error",
            time: "30 分钟前",
            href: "/orders/2024-0156",
        },
        {
            id: "3",
            title: "报价审批待处理",
            description: "2 个报价折扣申请等待您的审批",
            type: "info",
            time: "1 小时前",
            href: "/settings/approvals",
        },
        {
            id: "4",
            title: "收款提醒",
            description: "客户张先生的尾款 ¥12,000 已逾期 3 天",
            type: "warning",
            time: "2 小时前",
            href: "/finance/ar",
        },
    ];

    const criticalAlerts = alerts.filter(
        (a) => a.type === "error" || a.type === "warning"
    );
    const otherAlerts = alerts.filter(
        (a) => a.type !== "error" && a.type !== "warning"
    );

    return (
        <div className="space-y-6">
            {/* 紧急报警 */}
            {criticalAlerts.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        需要关注
                    </h3>
                    <div className="space-y-3">
                        {criticalAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))}
                    </div>
                </div>
            )}

            {/* 其他通知 */}
            {otherAlerts.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        系统通知
                    </h3>
                    <div className="space-y-3">
                        {otherAlerts.map((alert) => (
                            <AlertCard key={alert.id} alert={alert} />
                        ))}
                    </div>
                </div>
            )}

            {/* 空状态 */}
            {alerts.length === 0 && (
                <Card className="glass-liquid border-white/10">
                    <CardContent className="py-12 text-center">
                        <div className="text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-emerald-500" />
                            <p>暂无报警</p>
                            <p className="text-sm mt-1">一切运行正常</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/**
 * 报警卡片组件
 */
function AlertCard({ alert }: { alert: AlertItem }) {
    const iconMap = {
        warning: AlertTriangle,
        error: XCircle,
        info: Info,
        success: CheckCircle2,
    };

    const colorMap = {
        warning: "text-amber-500 bg-amber-500/10",
        error: "text-red-500 bg-red-500/10",
        info: "text-blue-500 bg-blue-500/10",
        success: "text-emerald-500 bg-emerald-500/10",
    };

    const Icon = iconMap[alert.type];
    const colorClass = colorMap[alert.type];

    const content = (
        <Card className="glass-liquid border-white/10 hover:bg-white/10 dark:hover:bg-white/5 transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-start gap-4">
                <div
                    className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        colorClass
                    )}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">{alert.title}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                            {alert.time}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {alert.description}
                    </p>
                </div>
                {alert.href && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-3" />
                )}
            </CardContent>
        </Card>
    );

    if (alert.href) {
        return <Link href={alert.href}>{content}</Link>;
    }

    return content;
}
