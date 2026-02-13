"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import { DashboardEditor } from "./dashboard-editor";

/**
 * 仪表盘 Tab 内容组件
 * 使用可配置的 DashboardEditor 展示用户自定义的 KPI 卡片
 */
export function DashboardTab() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 获取用户角色
        async function fetchUserRole() {
            try {
                const response = await fetch('/api/me');
                if (response.ok) {
                    const data = await response.json();
                    setUserRole(data.role || 'USER');
                } else {
                    setUserRole('USER');
                }
            } catch {
                setUserRole('USER');
            } finally {
                setLoading(false);
            }
        }
        fetchUserRole();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 可配置仪表盘 */}
            <DashboardEditor userRole={userRole || 'USER'} />

            {/* 销售趋势图表（固定位置） */}
            <Card className="glass-liquid border-white/10">
                <CardHeader>
                    <CardTitle className="text-base font-medium">销售趋势</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">图表开发中...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
