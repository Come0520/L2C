'use client';

import React from 'react';
import { Tabs } from "@/components/ui/tabs";
import { DashboardTab } from "@/features/dashboard/components/dashboard-tab";
import { TodoTab } from "@/features/dashboard/components/todo-tab";
import { AlertsTab } from "@/features/dashboard/components/alerts-tab";

/**
 * 工作台客户端组件
 * 使用 Aceternity Tabs 展示三个核心模块
 * 
 * 设计说明：
 * - Tab 内容区域使用实心背景以保证文字识别度
 * - 内部卡片组件使用 glass-liquid 透明效果
 */
export default function WorkbenchClient() {
    const tabs = [
        {
            title: "仪表盘",
            value: "dashboard",
            content: (
                <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <DashboardTab />
                </div>
            ),
        },
        {
            title: "待办事项",
            value: "todos",
            content: (
                <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <TodoTab />
                </div>
            ),
        },
        {
            title: "报警中心",
            value: "alerts",
            content: (
                <div className="w-full overflow-hidden relative h-full rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <AlertsTab />
                </div>
            ),
        },
    ];

    return (
        <div className="h-[calc(100vh-10rem)] perspective-[1000px] relative flex flex-col w-full items-start justify-start">
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

