import {
    leadStatusEnum,
    orderStatusEnum,
    decorationProgressEnum,
    customerPipelineStatusEnum,
    measureTaskStatusEnum,
    installTaskStatusEnum
} from '@/shared/api/schema/enums';

/**
 * 状态类型定义 (从 Enum 自动推导)
 */
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type DecorationProgress = (typeof decorationProgressEnum.enumValues)[number];
export type CustomerPipelineStatus = (typeof customerPipelineStatusEnum.enumValues)[number];
export type MeasureTaskStatus = (typeof measureTaskStatusEnum.enumValues)[number];
export type InstallTaskStatus = (typeof installTaskStatusEnum.enumValues)[number];


/**
 * 线索状态中文映射
 */
export const LeadStatusMap: Record<LeadStatus | string, string> = {
    'PENDING_ASSIGNMENT': '待分配',
    'PENDING_FOLLOWUP': '待跟进',
    'FOLLOWING_UP': '跟进中',
    'INVALID': '无效',
    'WON': '已赢单',
    'VOID': '作废' // 兼容性保留
};

/**
 * 订单状态中文映射
 */
export const OrderStatusMap: Record<OrderStatus | string, string> = {
    'DRAFT': '草稿',
    'PENDING_MEASURE': '待测量',
    'MEASURED': '已测量',
    'QUOTED': '已报价',
    'SIGNED': '已签约',
    'PAID': '已付款',
    'PENDING_PO': '待下单',
    'PENDING_PRODUCTION': '待生产',
    'IN_PRODUCTION': '生产中',
    'PAUSED': '已暂停',
    'PENDING_APPROVAL': '待审批',
    'PENDING_DELIVERY': '待发货',
    'PENDING_INSTALL': '待安装',
    'INSTALLATION_COMPLETED': '安装完成', // 待客户验收
    'PENDING_CONFIRMATION': '待确认',
    'INSTALLATION_REJECTED': '安装驳回',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
};

/**
 * 装修进度中文映射
 */
export const DecorationProgressMap: Record<DecorationProgress | string, string> = {
    'WATER_ELECTRIC': '水电阶段',
    'MUD_WOOD': '泥木阶段',
    'INSTALLATION': '安装阶段',
    'PAINTING': '油漆阶段',
    'COMPLETED': '装修完成'
};

/**
 * 客户跟进阶段中文映射
 */
export const CustomerPipelineStatusMap: Record<CustomerPipelineStatus | string, string> = {
    'UNASSIGNED': '未分配',
    'PENDING_FOLLOWUP': '待跟进',
    'PENDING_MEASUREMENT': '待测量',
    'PENDING_QUOTE': '待报价',
    'QUOTE_SENT': '已报价',
    'IN_PRODUCTION': '生产中',
    'PENDING_DELIVERY': '待发货',
    'PENDING_INSTALLATION': '待安装',
    'COMPLETED': '已完成'
};

/**
 * 测量任务状态中文映射
 */
export const MeasureTaskStatusMap: Record<MeasureTaskStatus | string, string> = {
    'PENDING_APPROVAL': '待审批',
    'PENDING': '待处理',
    'DISPATCHING': '派单中',
    'PENDING_VISIT': '待上门',
    'PENDING_CONFIRM': '待确认',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
};

/**
 * 安装任务状态中文映射
 */
export const InstallTaskStatusMap: Record<InstallTaskStatus | string, string> = {
    'PENDING_DISPATCH': '待派单',
    'DISPATCHING': '派单中',
    'PENDING_VISIT': '待上门',
    'PENDING_CONFIRM': '待确认',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
};

/**
 * 获取状态文本
 * @param map 状态映射表
 * @param status 状态值
 * @param defaultText 默认文本
 */
export function getStatusText(map: Record<string, string>, status: string | null | undefined, defaultText: string = ''): string {
    if (!status) return defaultText;
    return map[status] || status;
}
