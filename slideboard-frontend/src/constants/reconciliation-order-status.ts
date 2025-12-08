// 对账订单状态类型定义
interface ReconciliationOrderStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

// 对账订单状态常量定义
export const RECONCILIATION_ORDER_STATUS = {
  PENDING: 'pending',                // 待对账
  RECONCILING: 'reconciling',        // 对账中
  COMPLETED: 'completed',            // 已完成
  DISCREPANCY: 'discrepancy',        // 有差异
  ADJUSTED: 'adjusted',              // 已调整
  CANCELLED: 'cancelled'             // 已取消
} as const

export type ReconciliationOrderStatus = typeof RECONCILIATION_ORDER_STATUS[keyof typeof RECONCILIATION_ORDER_STATUS]

// 对账订单状态配置
export const RECONCILIATION_ORDER_STATUS_CONFIG: Record<ReconciliationOrderStatus, ReconciliationOrderStatusConfig> = {
  [RECONCILIATION_ORDER_STATUS.PENDING]: {
    label: '待对账',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  [RECONCILIATION_ORDER_STATUS.RECONCILING]: {
    label: '对账中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [RECONCILIATION_ORDER_STATUS.COMPLETED]: {
    label: '已完成',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [RECONCILIATION_ORDER_STATUS.DISCREPANCY]: {
    label: '有差异',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  [RECONCILIATION_ORDER_STATUS.ADJUSTED]: {
    label: '已调整',
    color: '#8BC34A',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [RECONCILIATION_ORDER_STATUS.CANCELLED]: {
    label: '已取消',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
}

// 对账订单状态流转规则
export const RECONCILIATION_ORDER_STATUS_TRANSITIONS: Record<ReconciliationOrderStatus, ReconciliationOrderStatus[]> = {
  [RECONCILIATION_ORDER_STATUS.PENDING]: [
    RECONCILIATION_ORDER_STATUS.RECONCILING,
    RECONCILIATION_ORDER_STATUS.CANCELLED
  ],
  [RECONCILIATION_ORDER_STATUS.RECONCILING]: [
    RECONCILIATION_ORDER_STATUS.COMPLETED,
    RECONCILIATION_ORDER_STATUS.DISCREPANCY,
    RECONCILIATION_ORDER_STATUS.CANCELLED
  ],
  [RECONCILIATION_ORDER_STATUS.DISCREPANCY]: [
    RECONCILIATION_ORDER_STATUS.ADJUSTED,
    RECONCILIATION_ORDER_STATUS.CANCELLED
  ],
  [RECONCILIATION_ORDER_STATUS.ADJUSTED]: [
    RECONCILIATION_ORDER_STATUS.RECONCILING,
    RECONCILIATION_ORDER_STATUS.CANCELLED
  ],
  [RECONCILIATION_ORDER_STATUS.COMPLETED]: [],
  [RECONCILIATION_ORDER_STATUS.CANCELLED]: []
}
