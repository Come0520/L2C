/**
 * 仪表盘类型定义
 * 单独文件避免循环导入
 */

/**
 * Widget 配置类型定义
 */
export type WidgetType =
    | 'sales-target'       // 销售目标完成率
    | 'sales-leads'        // 我的线索数
    | 'sales-conversion'   // 我的转化率
    | 'sales-avg-order'    // 我的客单价
    | 'team-sales'         // 团队销售额
    | 'team-target'        // 团队目标完成率
    | 'team-leaderboard'   // 销售排行榜
    | 'conversion-funnel'  // 销售漏斗
    | 'pending-measure'    // 待派发测量
    | 'pending-install'    // 待派发安装
    | 'today-schedule'     // 今日排班
    | 'ar-summary'         // 待收款
    | 'ap-summary'         // 待付款
    | 'cash-flow'          // 现金流
    | 'pending-approval'   // 待审批
    | 'sales-trend'        // 销售趋势
    | 'channel-performance'; // 渠道业绩

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
}

export interface UserDashboardConfig {
    version: number;
    columns: number;
    widgets: WidgetConfig[];
}
