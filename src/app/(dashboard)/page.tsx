"use client";

import React from "react";
import { Tabs } from "@/components/ui/tabs";
import { DashboardTab } from "@/features/dashboard/components/dashboard-tab";
import { TodoTab } from "@/features/dashboard/components/todo-tab";
import { AlertsTab } from "@/features/dashboard/components/alerts-tab";

/**
 * 工作台首页
 * 使用 Aceternity Tabs 组件展示三个核心模块
 */
export default function DashboardPage() {
    const tabs = [
        {
            title: "仪表盘",
            value: "dashboard",
            content: (
                <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 glass-liquid border border-white/10">
                    <DashboardTab />
                </div>
            ),
        },
        {
            title: "待办事项",
            value: "todos",
            content: (
                <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 glass-liquid border border-white/10">
                    <TodoTab />
                </div>
            ),
        },
        {
            title: "报警中心",
            value: "alerts",
            content: (
                <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 glass-liquid border border-white/10">
                    <AlertsTab />
                </div>
            ),
        },
    ];

    return (
        <div className="h-[calc(100vh-8rem)] [perspective:1000px] relative flex flex-col w-full items-start justify-start">
            <Tabs
                tabs={tabs}
                containerClassName="mb-4"
                activeTabClassName="bg-primary-500/20 dark:bg-primary-500/30"
                tabClassName="text-sm font-medium"
                contentClassName="mt-6"
            />
        </div>
    );
}
