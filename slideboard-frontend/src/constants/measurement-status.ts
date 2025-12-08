// 测量单状态类型定义
interface MeasurementStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  order: number
  timeLimit?: number
  reminderTime?: number
}

interface MeasurementStatusPermissions {
  canComplete?: string[]
  canUpdateStatus?: string[]
  canView?: string[]
  canConfirm?: string[]
  canReject?: string[]
}

// 测量单状态常量定义
export const MEASUREMENT_STATUS = {
  PENDING_MEASUREMENT: 'pending_measurement', // 待测量
  MEASURING_PENDING_ASSIGNMENT: 'measuring_pending_assignment', // 测量中-待分配
  MEASURING_ASSIGNING: 'measuring_assigning', // 测量中-分配中
  MEASURING_PENDING_VISIT: 'measuring_pending_visit', // 测量中-待上门
  MEASURING_PENDING_CONFIRMATION: 'measuring_pending_confirmation', // 测量中-待确认
  COMPLETED: 'completed', // 已完成
  CANCELLED: 'cancelled' // 已取消
} as const

export type MeasurementStatus = typeof MEASUREMENT_STATUS[keyof typeof MEASUREMENT_STATUS]

// 测量单状态配置
export const MEASUREMENT_STATUS_CONFIG: Record<MeasurementStatus, MeasurementStatusConfig> = {
  [MEASUREMENT_STATUS.PENDING_MEASUREMENT]: {
    label: '待测量',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    order: 1
  },
  [MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT]: {
    label: '测量中-待分配',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    order: 2
  },
  [MEASUREMENT_STATUS.MEASURING_ASSIGNING]: {
    label: '测量中-分配中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    order: 3
  },
  [MEASUREMENT_STATUS.MEASURING_PENDING_VISIT]: {
    label: '测量中-待上门',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    order: 4,
    timeLimit: 48 * 60 * 60 * 1000, // 48小时时效限制
    reminderTime: 24 * 60 * 60 * 1000 // 24小时提醒
  },
  [MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION]: {
    label: '测量中-待确认',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    order: 5,
    timeLimit: 48 * 60 * 60 * 1000, // 48小时时效限制
    reminderTime: 24 * 60 * 60 * 1000 // 24小时提醒
  },
  [MEASUREMENT_STATUS.COMPLETED]: {
    label: '已完成',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    order: 6
  },
  [MEASUREMENT_STATUS.CANCELLED]: {
    label: '已取消',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    order: 7
  }
}

// 测量单状态流转规则
export const MEASUREMENT_STATUS_TRANSITIONS: Record<MeasurementStatus, MeasurementStatus[]> = {
  [MEASUREMENT_STATUS.PENDING_MEASUREMENT]: [
    MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT,
    MEASUREMENT_STATUS.COMPLETED,
    MEASUREMENT_STATUS.CANCELLED
  ],
  [MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT]: [
    MEASUREMENT_STATUS.MEASURING_ASSIGNING,
    MEASUREMENT_STATUS.CANCELLED
  ],
  [MEASUREMENT_STATUS.MEASURING_ASSIGNING]: [
    MEASUREMENT_STATUS.MEASURING_PENDING_VISIT,
    MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT,
    MEASUREMENT_STATUS.CANCELLED
  ],
  [MEASUREMENT_STATUS.MEASURING_PENDING_VISIT]: [
    MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION,
    MEASUREMENT_STATUS.MEASURING_ASSIGNING,
    MEASUREMENT_STATUS.CANCELLED
  ],
  [MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION]: [
    MEASUREMENT_STATUS.COMPLETED,
    MEASUREMENT_STATUS.MEASURING_PENDING_VISIT,
    MEASUREMENT_STATUS.CANCELLED
  ],
  [MEASUREMENT_STATUS.COMPLETED]: [],
  [MEASUREMENT_STATUS.CANCELLED]: []
}

// 测量单状态权限配置
export const MEASUREMENT_STATUS_PERMISSIONS: Record<MeasurementStatus, MeasurementStatusPermissions> = {
  [MEASUREMENT_STATUS.MEASURING_PENDING_VISIT]: {
    canComplete: ['SERVICE_MEASURE'], // 可完成测量的角色
    canUpdateStatus: ['SERVICE_MEASURE', 'SERVICE_DISPATCH'], // 可更新状态的角色
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN'] // 可查看的角色
  },
  [MEASUREMENT_STATUS.MEASURING_PENDING_CONFIRMATION]: {
    canConfirm: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL'], // 可确认测量结果的角色
    canReject: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL'], // 可驳回测量结果的角色
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN'] // 可查看的角色
  },
  [MEASUREMENT_STATUS.PENDING_MEASUREMENT]: {
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN']
  },
  [MEASUREMENT_STATUS.MEASURING_PENDING_ASSIGNMENT]: {
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN']
  },
  [MEASUREMENT_STATUS.MEASURING_ASSIGNING]: {
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN']
  },
  [MEASUREMENT_STATUS.COMPLETED]: {
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN']
  },
  [MEASUREMENT_STATUS.CANCELLED]: {
    canView: ['SALES_STORE', 'SALES_REMOTE', 'SALES_CHANNEL', 'SERVICE_DISPATCH', 'SERVICE_MEASURE', 'SALES_MANAGER', 'LEAD_CHANNEL', 'LEAD_ADMIN']
  }
}
