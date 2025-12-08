// 测量订单状态类型定义
interface MeasurementOrderStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

// 测量订单状态常量定义
export const MEASUREMENT_ORDER_STATUS = {
  PENDING: 'pending',                // 待安排
  SCHEDULED: 'scheduled',            // 已排期
  IN_PROGRESS: 'in_progress',        // 测量中
  COMPLETED: 'completed',            // 已完成
  REJECTED: 'rejected',              // 已驳回
  CANCELLED: 'cancelled'             // 已取消
} as const

export type MeasurementOrderStatus = typeof MEASUREMENT_ORDER_STATUS[keyof typeof MEASUREMENT_ORDER_STATUS]

// 测量订单状态配置
export const MEASUREMENT_ORDER_STATUS_CONFIG: Record<MeasurementOrderStatus, MeasurementOrderStatusConfig> = {
  [MEASUREMENT_ORDER_STATUS.PENDING]: {
    label: '待安排',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  [MEASUREMENT_ORDER_STATUS.SCHEDULED]: {
    label: '已排期',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  [MEASUREMENT_ORDER_STATUS.IN_PROGRESS]: {
    label: '测量中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [MEASUREMENT_ORDER_STATUS.COMPLETED]: {
    label: '已完成',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [MEASUREMENT_ORDER_STATUS.REJECTED]: {
    label: '已驳回',
    color: '#F44336',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  [MEASUREMENT_ORDER_STATUS.CANCELLED]: {
    label: '已取消',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
}

// 测量订单状态流转规则
export const MEASUREMENT_ORDER_STATUS_TRANSITIONS: Record<MeasurementOrderStatus, MeasurementOrderStatus[]> = {
  [MEASUREMENT_ORDER_STATUS.PENDING]: [
    MEASUREMENT_ORDER_STATUS.SCHEDULED,
    MEASUREMENT_ORDER_STATUS.CANCELLED
  ],
  [MEASUREMENT_ORDER_STATUS.SCHEDULED]: [
    MEASUREMENT_ORDER_STATUS.IN_PROGRESS,
    MEASUREMENT_ORDER_STATUS.CANCELLED
  ],
  [MEASUREMENT_ORDER_STATUS.IN_PROGRESS]: [
    MEASUREMENT_ORDER_STATUS.COMPLETED,
    MEASUREMENT_ORDER_STATUS.REJECTED,
    MEASUREMENT_ORDER_STATUS.CANCELLED
  ],
  [MEASUREMENT_ORDER_STATUS.COMPLETED]: [],
  [MEASUREMENT_ORDER_STATUS.REJECTED]: [
    MEASUREMENT_ORDER_STATUS.PENDING,
    MEASUREMENT_ORDER_STATUS.CANCELLED
  ],
  [MEASUREMENT_ORDER_STATUS.CANCELLED]: []
}
