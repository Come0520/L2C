/**
 * Dashboard Widgets 模块导出
 */

// Widget 注册表
export { WIDGET_REGISTRY, getAvailableWidgets, PlaceholderWidget } from './registry';
export type { WidgetMeta } from './registry';

// 销售专属 Widget
export {
    SalesTargetWidget,
    SalesLeadsWidget,
    SalesConversionWidget,
    SalesAvgOrderWidget,
} from './sales-widgets';

// 管理层 Widget
export {
    TeamSalesWidget,
    TeamTargetWidget,
    TeamLeaderboardWidget,
    PendingApprovalWidget,
    SalesTrendWidget,
} from './manager-widgets';

// 派单员和财务 Widget
export {
    PendingMeasureWidget,
    PendingInstallWidget,
    TodayScheduleWidget,
    ARSummaryWidget,
    APSummaryWidget,
    CashFlowWidget,
    ConversionFunnelWidget,
} from './service-widgets';

// Widget 渲染器
export { WidgetRenderer } from './widget-renderer';
