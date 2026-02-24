'use client';

import React, { useState, useCallback } from 'react';
import { ConfigurableDashboard } from './configurable-dashboard';
import { getDashboardConfigAction, saveDashboardConfigAction, resetDashboardConfigAction } from '../actions/config';
import { WidgetConfig, UserDashboardConfig as DashboardLayoutConfig } from '../types';
import { getDefaultDashboardConfig } from '../utils';
import { Button } from '@/shared/ui/button';
import Settings from 'lucide-react/dist/esm/icons/settings';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import { toast } from 'sonner';

// Widget 组件导入
import { StatCard } from '@/features/analytics/components/stat-card';
import { ArApSummaryCard } from '@/features/analytics/components/ar-ap-summary-card';
import { DeliveryEfficiencyCard } from '@/features/analytics/components/delivery-efficiency-card';
import { CustomerSourceChart } from '@/features/analytics/components/customer-source-chart';
import { SalesFunnelChart } from '@/features/analytics/components/sales-funnel-chart';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Users from 'lucide-react/dist/esm/icons/users';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import Percent from 'lucide-react/dist/esm/icons/percent';

interface DashboardPageClientProps {
    initialConfig?: DashboardLayoutConfig;
    statsData?: {
        totalSales: string;
        orderCount: number;
        newLeads: number;
        conversionRate: string;
        pendingReceivables: string;
        pendingPayables: string;
    };
    deliveryData?: {
        measureAvgDays: number;
        measureOnTimeRate: number;
        installAvgDays: number;
        installOnTimeRate: number;
        totalPendingTasks: number;
        overdueTaskCount: number;
    };
    sourceData?: { name: string; value: number }[];
    funnelData?: { stage: string; count: number }[];
}

/**
 * 仪表盘客户端组件
 * 整合可配置布局与实际数据渲染
 */
export function DashboardPageClient({
    initialConfig,
    statsData,
    deliveryData,
    sourceData = [],
    funnelData = [],
}: DashboardPageClientProps) {
    const [config, setConfig] = useState<DashboardLayoutConfig>(initialConfig || getDefaultDashboardConfig(''));
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 处理配置变更
    const handleConfigChange = useCallback((newConfig: DashboardLayoutConfig) => {
        setConfig(newConfig);
    }, []);

    // 保存配置
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveDashboardConfigAction(config);
            toast.success('布局已保存');
            setIsEditing(false);
        } catch (_e) {
            toast.error('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    // 重置配置
    const handleReset = async () => {
        await resetDashboardConfigAction({});
        setConfig(getDefaultDashboardConfig(''));
        toast.success('已重置为默认布局');
    };

    // 取消编辑
    const handleCancel = async () => {
        // 重新加载配置
        const savedConfig = await getDashboardConfigAction();
        setConfig(savedConfig);
        setIsEditing(false);
    };

    // 渲染 Widget
    const renderWidget = useCallback((widget: WidgetConfig) => {
        switch (widget.type) {
            case 'kpi-sales':
                return (
                    <StatCard
                        title="本月签约"
                        value={`¥${Number(statsData?.totalSales || 0).toLocaleString()}`}
                        icon={DollarSign}
                        trend={{ value: 12.5, label: '较上月' }}
                    />
                );
            case 'kpi-leads':
                return (
                    <StatCard
                        title="待跟进线索"
                        value={statsData?.newLeads || 0}
                        icon={Users}
                        description="本月新增"
                    />
                );
            case 'kpi-orders':
                return (
                    <StatCard
                        title="成交订单"
                        value={statsData?.orderCount || 0}
                        icon={ShoppingCart}
                        description="本月成交"
                    />
                );
            case 'kpi-conversion':
                return (
                    <StatCard
                        title="转化率"
                        value={`${statsData?.conversionRate || 0}%`}
                        icon={Percent}
                        description="线索转订单"
                    />
                );
            case 'ar-ap-summary':
                return (
                    <ArApSummaryCard
                        pendingReceivables={statsData?.pendingReceivables || '0'}
                        pendingPayables={statsData?.pendingPayables || '0'}
                    />
                );
            case 'delivery-efficiency':
                return (
                    <DeliveryEfficiencyCard
                        measureAvgDays={deliveryData?.measureAvgDays}
                        measureOnTimeRate={deliveryData?.measureOnTimeRate}
                        installAvgDays={deliveryData?.installAvgDays}
                        installOnTimeRate={deliveryData?.installOnTimeRate}
                        totalPendingTasks={deliveryData?.totalPendingTasks}
                        overdueTaskCount={deliveryData?.overdueTaskCount}
                    />
                );
            case 'customer-source':
                return (
                    <CustomerSourceChart data={sourceData} />
                );
            case 'sales-funnel':
                return (
                    <SalesFunnelChart data={funnelData} />
                );
            default:
                return (
                    <div className="h-full bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                        {widget.title}
                    </div>
                );
        }
    }, [statsData, deliveryData, sourceData, funnelData]);

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-end gap-2">
                {isEditing ? (
                    <>
                        <Button variant="outline" size="sm" onClick={handleReset}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            重置
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                            <X className="h-4 w-4 mr-1" />
                            取消
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            <Save className="h-4 w-4 mr-1" />
                            保存布局
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Settings className="h-4 w-4 mr-1" />
                        自定义布局
                    </Button>
                )}
            </div>

            {/* 可配置仪表盘 */}
            <ConfigurableDashboard
                config={config}
                onConfigChange={handleConfigChange}
                renderWidget={renderWidget}
                isEditing={isEditing}
            />
        </div>
    );
}
