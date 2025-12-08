
export type OrderStatus =
    | 'draft-sign'
    | 'pending-survey'
    | 'surveying-pending-assignment'
    | 'surveying-assigning'
    | 'surveying-pending-visit'
    | 'surveying-pending-confirmation'
    | 'plan-pending-confirmation'
    | 'pending-push'
    | 'pending-place-order'
    | 'in-production'
    | 'stock-ready'
    | 'pending-shipment'
    | 'installing-pending-assignment'
    | 'installing-assigning'
    | 'installing-pending-visit'
    | 'installing-pending-confirmation'
    | 'pending-reconciliation'
    | 'pending-invoice'
    | 'pending-payment'
    | 'completed'
    | 'cancelled';

export type OrderAction =
    | 'urge'
    | 'batch'
    | 'progress'
    | 'remind'
    | 'view'
    | 'review'
    | 'next'
    | 'confirm'
    | 'modify'
    | 'install'
    | 'deliver'
    | 'complete'
    | 'service'
    | 'restore';

export interface StateConfig {
    label: string;
    actions: Array<{ key: OrderAction; label: string }>;
    next?: OrderStatus[]; // Potential next states for validation
}

export const ORDER_STATUS_CONFIG: Record<string, StateConfig> = {
    'draft-sign': { label: '开单', actions: [] },
    'pending-survey': { label: '待测量', actions: [] },
    'surveying-pending-assignment': { label: '测量中-待分配', actions: [] },
    'surveying-assigning': {
        label: '测量中-分配中',
        actions: [
            { key: 'urge', label: '催单' },
            { key: 'batch', label: '批量催单' }
        ]
    },
    'surveying-pending-visit': { label: '测量中-待上门', actions: [] },
    'surveying-pending-confirmation': { label: '测量中-待确认', actions: [] }, // Maybe 'progress'?
    'surveying-pending': { // Mapped from original code 'surveying-pending' which seems to be a grouping or valid status? 
        // Wait, original code key was 'surveying-pending'. Page.tsx lines 140.
        // Is this a status? Or a category?
        // Looking at the Page component, `status` comes from URL params. 
        // The `if` blocks check for 'surveying-pending-assignment', etc. 
        // The `actions` object has 'surveying-pending'. 
        // I should check if 'surveying-pending' is a real status or if the actions map is using slightly different keys.
        // Actually, looking at `titles`: it aligns with `actions` in some places but not others.
        // 'surveying-assigning' is in both.
        // 'surveying-pending' is in `actions` but NOT in `titles`?
        // 'surveying-ongoing' is in `actions` but NOT in `titles`.
        // This implies `actions` might be using a fuzzy match or the `status` param can be these values.
        // BUT `page.tsx` line 178: `const actionsForStatus = actions[status] || []`.
        // So the exact status string must match. 
        // I will include all keys from `titles` and `actions` for now to be safe.
        label: '测量中-待处理',
        actions: [
            { key: 'progress', label: '推进' },
            { key: 'remind', label: '提醒' }
        ]
    },
    'surveying-ongoing': {
        label: '测量进行中',
        actions: [
            { key: 'progress', label: '推进' },
            { key: 'view', label: '查看进度' }
        ]
    },
    'surveying-completed': {
        label: '测量完成',
        actions: [
            { key: 'review', label: '审核' },
            { key: 'next', label: '下一步' }
        ]
    },
    'plan-pending-confirmation': { label: '方案待确认', actions: [] },
    'pending-push': { label: '待推单', actions: [] },
    'pending-place-order': { label: '待下单', actions: [] },
    'in-production': { label: '生产/备货中', actions: [] },
    'production-pending': { // From actions
        label: '生产待确认',
        actions: [
            { key: 'confirm', label: '确认生产' },
            { key: 'modify', label: '修改方案' }
        ]
    },
    'production-ongoing': { // From actions
        label: '生产进行中',
        actions: [
            { key: 'progress', label: '推进' },
            { key: 'view', label: '查看进度' }
        ]
    },
    'production-completed': { // From actions
        label: '生产完成',
        actions: [
            { key: 'install', label: '安排安装' },
            { key: 'deliver', label: '安排发货' }
        ]
    },
    'stock-ready': { label: '备货完成', actions: [] },
    'pending-shipment': { label: '待发货', actions: [] },
    'installing-pending-assignment': { label: '安装中-待分配', actions: [] },
    'installing-assigning': { label: '安装中-分配中', actions: [] },
    'installing-pending-visit': { label: '安装中-待上门', actions: [] },
    'installing-pending-confirmation': { label: '安装中-待确认', actions: [] },
    'installed': { // From actions
        label: '已安装',
        actions: [
            { key: 'complete', label: '完成订单' },
            { key: 'service', label: '售后服务' }
        ]
    },
    'pending-reconciliation': { label: '待对账', actions: [] },
    'pending-invoice': { label: '待开票', actions: [] },
    'pending-payment': { label: '待回款', actions: [] },
    'completed': { label: '已完成', actions: [] },
    'cancelled': {
        label: '已取消',
        actions: [
            { key: 'view', label: '查看详情' },
            { key: 'restore', label: '恢复订单' }
        ]
    },
};

export function getOrderStatusConfig(status: string): StateConfig | undefined {
    return ORDER_STATUS_CONFIG[status];
}

export function getOrderNextStates(status: string): OrderStatus[] {
    return ORDER_STATUS_CONFIG[status]?.next || [];
}
