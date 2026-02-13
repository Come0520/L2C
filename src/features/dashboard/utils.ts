/**
 * 仪表盘配置工具函数
 * 这些是纯函数，不是 Server Actions，所以放在单独文件中
 */

import type { WidgetType, UserDashboardConfig } from './types';

/**
 * 根据用户角色获取默认配置
 */
export function getDefaultDashboardConfig(role: string): UserDashboardConfig {
    const baseConfig: UserDashboardConfig = {
        version: 1,
        columns: 4,
        widgets: []
    };

    if (role === 'SALES') {
        baseConfig.widgets = [
            { id: 'w1', type: 'sales-target', x: 0, y: 0, w: 2, h: 1, visible: true },
            { id: 'w2', type: 'sales-leads', x: 2, y: 0, w: 1, h: 1, visible: true },
            { id: 'w3', type: 'sales-conversion', x: 3, y: 0, w: 1, h: 1, visible: true },
            { id: 'w4', type: 'sales-avg-order', x: 0, y: 1, w: 1, h: 1, visible: true },
            { id: 'w5', type: 'pending-approval', x: 1, y: 1, w: 1, h: 1, visible: true },
        ];
    } else if (role === 'MANAGER' || role === 'ADMIN') {
        baseConfig.widgets = [
            { id: 'w1', type: 'team-sales', x: 0, y: 0, w: 1, h: 1, visible: true },
            { id: 'w2', type: 'team-target', x: 1, y: 0, w: 1, h: 1, visible: true },
            { id: 'w3', type: 'pending-measure', x: 2, y: 0, w: 1, h: 1, visible: true },
            { id: 'w4', type: 'pending-install', x: 3, y: 0, w: 1, h: 1, visible: true },
            { id: 'w5', type: 'team-leaderboard', x: 0, y: 1, w: 2, h: 2, visible: true },
            { id: 'w6', type: 'sales-trend', x: 2, y: 1, w: 2, h: 2, visible: true },
            { id: 'w7', type: 'channel-performance', x: 0, y: 3, w: 2, h: 2, visible: true },
            { id: 'w8', type: 'pending-approval', x: 2, y: 3, w: 1, h: 1, visible: true },
        ];
    } else if (role === 'DISPATCHER') {
        baseConfig.widgets = [
            { id: 'w1', type: 'pending-measure', x: 0, y: 0, w: 2, h: 1, visible: true },
            { id: 'w2', type: 'pending-install', x: 2, y: 0, w: 2, h: 1, visible: true },
            { id: 'w3', type: 'today-schedule', x: 0, y: 1, w: 4, h: 2, visible: true },
        ];
    } else if (role === 'FINANCE') {
        baseConfig.widgets = [
            { id: 'w1', type: 'ar-summary', x: 0, y: 0, w: 2, h: 1, visible: true },
            { id: 'w2', type: 'ap-summary', x: 2, y: 0, w: 2, h: 1, visible: true },
            { id: 'w3', type: 'cash-flow', x: 0, y: 1, w: 4, h: 2, visible: true },
            { id: 'w4', type: 'pending-approval', x: 0, y: 3, w: 1, h: 1, visible: true },
        ];
    } else {
        // 默认配置
        baseConfig.widgets = [
            { id: 'w1', type: 'pending-approval', x: 0, y: 0, w: 2, h: 1, visible: true },
        ];
    }

    return baseConfig;
}
