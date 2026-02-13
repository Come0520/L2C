'use client';

import {
    LeadSettingsConfig,
    ChannelSettingsConfig,
    PaymentSettingsConfig,
    MeasureSettingsConfig,
    OrderSettingsConfig,
    ApprovalSettingsConfig,
    NotificationSettingsConfig,
    ReportSettingsConfig,
} from './system-settings-index';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Users, Share2, CreditCard, Ruler, Package, CheckCircle, Bell, BarChart3 } from 'lucide-react';

/**
 * 系统设置主组件
 * 包含所有 8 类设置的 Tab 导航
 */

const SETTING_TABS = [
    { id: 'lead', label: '线索', icon: Users, component: LeadSettingsConfig },
    { id: 'channel', label: '渠道', icon: Share2, component: ChannelSettingsConfig },
    { id: 'payment', label: '收款', icon: CreditCard, component: PaymentSettingsConfig },
    { id: 'measure', label: '测量', icon: Ruler, component: MeasureSettingsConfig },
    { id: 'order', label: '订单', icon: Package, component: OrderSettingsConfig },
    { id: 'approval', label: '审批流', icon: CheckCircle, component: ApprovalSettingsConfig },
    { id: 'notification', label: '通知', icon: Bell, component: NotificationSettingsConfig },
    { id: 'report', label: '报表', icon: BarChart3, component: ReportSettingsConfig },
];

export function SystemSettingsPanel() {
    return (
        <Tabs defaultValue="lead" className="w-full">
            <TabsList className="grid w-full grid-cols-8 h-auto p-1">
                {SETTING_TABS.map(tab => (
                    <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-1 py-2 text-xs"
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {SETTING_TABS.map(tab => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                    <tab.component />
                </TabsContent>
            ))}
        </Tabs>
    );
}
