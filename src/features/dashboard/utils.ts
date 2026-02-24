/**
 * 仪表盘配置工具函数
 * 这些是纯函数，不是 Server Actions，所以放在单独文件中
 */

import type { UserDashboardConfig } from './types';

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
            { id: 'w1', type: 'sales-target', title: '销售目标完成率', x: 0, y: 0, w: 2, h: 1, visible: true },
            { id: 'w2', type: 'sales-leads', title: '我的线索数', x: 2, y: 0, w: 1, h: 1, visible: true },
            { id: 'w3', type: 'sales-conversion', title: '我的转化率', x: 3, y: 0, w: 1, h: 1, visible: true },
            { id: 'w4', type: 'sales-avg-order', title: '我的客单价', x: 0, y: 1, w: 1, h: 1, visible: true },
            { id: 'w5', type: 'pending-approval', title: '待审批', x: 1, y: 1, w: 1, h: 1, visible: true },
        ];
    } else if (role === 'MANAGER' || role === 'ADMIN' || role === 'TENANT_ADMIN' || role === 'SUPER_ADMIN' || role === 'OWNER') {
        baseConfig.widgets = [
            { id: 'w1', type: 'team-sales', title: '团队销售额', x: 0, y: 0, w: 1, h: 1, visible: true },
            { id: 'w2', type: 'team-target', title: '团队目标完成率', x: 1, y: 0, w: 1, h: 1, visible: true },
            { id: 'w3', type: 'pending-measure', title: '待派发测量', x: 2, y: 0, w: 1, h: 1, visible: true },
            { id: 'w4', type: 'pending-install', title: '待派发安装', x: 3, y: 0, w: 1, h: 1, visible: true },
            { id: 'w5', type: 'team-leaderboard', title: '销售排行榜', x: 0, y: 1, w: 2, h: 2, visible: true },
            { id: 'w6', type: 'sales-trend', title: '销售趋势', x: 2, y: 1, w: 2, h: 2, visible: true },
            { id: 'w7', type: 'channel-performance', title: '渠道业绩', x: 0, y: 3, w: 2, h: 2, visible: true },
            { id: 'w8', type: 'pending-approval', title: '待审批', x: 2, y: 3, w: 1, h: 1, visible: true },
        ];
    } else if (role === 'DISPATCHER') {
        baseConfig.widgets = [
            { id: 'w1', type: 'pending-measure', title: '待派发测量', x: 0, y: 0, w: 2, h: 1, visible: true },
            { id: 'w2', type: 'pending-install', title: '待派发安装', x: 2, y: 0, w: 2, h: 1, visible: true },
            { id: 'w3', type: 'today-schedule', title: '今日排班', x: 0, y: 1, w: 4, h: 2, visible: true },
        ];
    } else if (role === 'FINANCE') {
        baseConfig.widgets = [
            { id: 'w1', type: 'ar-summary', title: '待收款', x: 0, y: 0, w: 2, h: 1, visible: true },
            { id: 'w2', type: 'ap-summary', title: '待付款', x: 2, y: 0, w: 2, h: 1, visible: true },
            { id: 'w3', type: 'cash-flow', title: '现金流', x: 0, y: 1, w: 4, h: 2, visible: true },
            { id: 'w4', type: 'pending-approval', title: '待审批', x: 0, y: 3, w: 1, h: 1, visible: true },
        ];
    } else {
        // 默认配置
        baseConfig.widgets = [
            { id: 'w1', type: 'pending-approval', title: '待审批', x: 0, y: 0, w: 2, h: 1, visible: true },
        ];
    }

    return baseConfig;
}
