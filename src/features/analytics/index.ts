/**
 * 分析模块统一导出
 * 54KB 巨型 actions.ts 已拆分为 11 个按业务域分类的独立文件
 */

// 核心仪表盘
export { getDashboardStats } from './actions/dashboard-stats';

// 销售漏斗
export { getSalesFunnel } from './actions/sales-funnel';

// 业绩排名
export { getLeaderboard } from './actions/leaderboard';

// 订单趋势
export { getOrderTrend } from './actions/order-trend';

// 交付效率
export { getDeliveryEfficiency } from './actions/delivery-efficiency';

// 客户来源分布
export { getCustomerSourceDistribution } from './actions/customer-source';

// 利润率分析
export { getProfitMarginAnalysis } from './actions/profit-margin';

// 售后健康度
export { getAfterSalesHealth } from './actions/after-sales-health';

// 现金流预测
export { getCashFlowForecast } from './actions/cash-flow';

// AR 账龄分析
export { getARAgingAnalysis } from './actions/ar-aging';

// 报价参考价格
export { getPricingReference } from './actions/pricing-reference';
