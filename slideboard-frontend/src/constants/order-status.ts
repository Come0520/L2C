// 订单状态类型定义
interface OrderStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

// 订单状态常量定义
export const ORDER_STATUS = {
  // 线索阶段
  PENDING_ASSIGNMENT: 'pending_assignment', // 待分配
  PENDING_FOLLOW_UP: 'pending_tracking', // 待跟踪
  FOLLOWING_UP: 'tracking', // 跟踪中
  DRAFT_SIGNED: 'draft_signed', // 草签
  EXPIRED: 'expired', // 已失效
  
  // 测量阶段
  PENDING_MEASUREMENT: 'pending_measurement', // 待测量
  MEASURING_PENDING_ASSIGNMENT: 'measuring_pending_assignment', // 测量中-待分配
  MEASURING_ASSIGNING: 'measuring_assigning', // 测量中-分配中
  MEASURING_PENDING_VISIT: 'measuring_pending_visit', // 测量中-待上门
  MEASURING_PENDING_CONFIRMATION: 'measuring_pending_confirmation', // 测量中-待确认
  PLAN_PENDING_CONFIRMATION: 'plan_pending_confirmation', // 方案待确认
  
  // 订单处理阶段
  PENDING_PUSH: 'pending_push', // 待推单
  PENDING_ORDER: 'pending_order', // 待下单
  IN_PRODUCTION: 'in_production', // 生产中
  STOCK_PREPARED: 'stock_prepared', // 备货完成
  PENDING_SHIPMENT: 'pending_shipment', // 待发货
  SHIPPED: 'shipped', // 已发货
  
  // 安装阶段
  INSTALLING_PENDING_ASSIGNMENT: 'installing_pending_assignment', // 安装中-待分配
  INSTALLING_ASSIGNING: 'installing_assigning', // 安装中-分配中
  INSTALLING_PENDING_VISIT: 'installing_pending_visit', // 安装中-待上门
  INSTALLING_PENDING_CONFIRMATION: 'installing_pending_confirmation', // 安装中-待确认
  DELIVERED: 'delivered', // 已交付
  
  // 财务阶段
  PENDING_RECONCILIATION: 'pending_reconciliation', // 待对账
  PENDING_INVOICE: 'pending_invoice', // 待开发票
  PENDING_PAYMENT: 'pending_payment', // 待回款
  COMPLETED: 'completed', // 已完成
  
  // 异常状态
  CANCELLED: 'cancelled', // 已取消
  SUSPENDED: 'suspended', // 暂停
  EXCEPTION: 'exception' // 异常
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

// 订单状态流转规则
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // 线索阶段流转
  [ORDER_STATUS.PENDING_ASSIGNMENT]: [ORDER_STATUS.PENDING_FOLLOW_UP, ORDER_STATUS.CANCELLED, ORDER_STATUS.EXPIRED],
  [ORDER_STATUS.PENDING_FOLLOW_UP]: [ORDER_STATUS.FOLLOWING_UP, ORDER_STATUS.CANCELLED, ORDER_STATUS.EXPIRED],
  [ORDER_STATUS.FOLLOWING_UP]: [ORDER_STATUS.DRAFT_SIGNED, ORDER_STATUS.CANCELLED, ORDER_STATUS.EXPIRED],
  [ORDER_STATUS.DRAFT_SIGNED]: [ORDER_STATUS.PENDING_MEASUREMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.EXPIRED],
  [ORDER_STATUS.EXPIRED]: [],
  
  // 测量阶段流转
  [ORDER_STATUS.PENDING_MEASUREMENT]: [ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT]: [ORDER_STATUS.MEASURING_ASSIGNING, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.MEASURING_ASSIGNING]: [ORDER_STATUS.MEASURING_PENDING_VISIT, ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.MEASURING_PENDING_VISIT]: [ORDER_STATUS.MEASURING_PENDING_CONFIRMATION, ORDER_STATUS.MEASURING_ASSIGNING, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.MEASURING_PENDING_CONFIRMATION]: [ORDER_STATUS.PLAN_PENDING_CONFIRMATION, ORDER_STATUS.MEASURING_PENDING_VISIT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.PLAN_PENDING_CONFIRMATION]: [ORDER_STATUS.PENDING_PUSH, ORDER_STATUS.MEASURING_PENDING_CONFIRMATION, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  
  // 订单处理阶段流转
  [ORDER_STATUS.PENDING_PUSH]: [ORDER_STATUS.PENDING_ORDER, ORDER_STATUS.PLAN_PENDING_CONFIRMATION, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.PENDING_ORDER]: [ORDER_STATUS.IN_PRODUCTION, ORDER_STATUS.PENDING_PUSH, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.IN_PRODUCTION]: [ORDER_STATUS.STOCK_PREPARED, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED, ORDER_STATUS.EXCEPTION],
  [ORDER_STATUS.STOCK_PREPARED]: [ORDER_STATUS.PENDING_SHIPMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED, ORDER_STATUS.EXCEPTION],
  [ORDER_STATUS.PENDING_SHIPMENT]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED, ORDER_STATUS.EXCEPTION],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  
  // 安装阶段流转
  [ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT]: [ORDER_STATUS.INSTALLING_ASSIGNING, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.INSTALLING_ASSIGNING]: [ORDER_STATUS.INSTALLING_PENDING_VISIT, ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.INSTALLING_PENDING_VISIT]: [ORDER_STATUS.INSTALLING_PENDING_CONFIRMATION, ORDER_STATUS.INSTALLING_ASSIGNING, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.INSTALLING_PENDING_CONFIRMATION]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.INSTALLING_PENDING_VISIT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.PENDING_RECONCILIATION, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  
  // 财务阶段流转
  [ORDER_STATUS.PENDING_RECONCILIATION]: [ORDER_STATUS.PENDING_INVOICE, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.PENDING_INVOICE]: [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.PENDING_PAYMENT]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED, ORDER_STATUS.SUSPENDED],
  [ORDER_STATUS.COMPLETED]: [],
  
  // 异常状态流转
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.SUSPENDED]: [ORDER_STATUS.EXCEPTION, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.EXCEPTION]: [ORDER_STATUS.CANCELLED]
}

// 订单状态配置
export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  // 线索阶段配置
  [ORDER_STATUS.PENDING_ASSIGNMENT]: {
    label: '待分配',
    color: '#FF5722',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  [ORDER_STATUS.PENDING_FOLLOW_UP]: {
    label: '待跟踪',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  [ORDER_STATUS.FOLLOWING_UP]: {
    label: '跟踪中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [ORDER_STATUS.DRAFT_SIGNED]: {
    label: '草签',
    color: '#3F51B5',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200'
  },
  [ORDER_STATUS.EXPIRED]: {
    label: '已失效',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  
  // 测量阶段配置
  [ORDER_STATUS.PENDING_MEASUREMENT]: {
    label: '待测量',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  [ORDER_STATUS.MEASURING_PENDING_ASSIGNMENT]: {
    label: '测量中-待分配',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  [ORDER_STATUS.MEASURING_ASSIGNING]: {
    label: '测量中-分配中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [ORDER_STATUS.MEASURING_PENDING_VISIT]: {
    label: '测量中-待上门',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [ORDER_STATUS.MEASURING_PENDING_CONFIRMATION]: {
    label: '测量中-待确认',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  [ORDER_STATUS.PLAN_PENDING_CONFIRMATION]: {
    label: '方案待确认',
    color: '#3F51B5',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200'
  },
  
  // 订单处理阶段配置
  [ORDER_STATUS.PENDING_PUSH]: {
    label: '待推单',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  [ORDER_STATUS.PENDING_ORDER]: {
    label: '待下单',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  [ORDER_STATUS.IN_PRODUCTION]: {
    label: '生产中',
    color: '#FF5722',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  [ORDER_STATUS.STOCK_PREPARED]: {
    label: '备货完成',
    color: '#8BC34A',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [ORDER_STATUS.PENDING_SHIPMENT]: {
    label: '待发货',
    color: '#00BCD4',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200'
  },
  [ORDER_STATUS.SHIPPED]: {
    label: '已发货',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  
  // 安装阶段配置
  [ORDER_STATUS.INSTALLING_PENDING_ASSIGNMENT]: {
    label: '安装中-待分配',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  [ORDER_STATUS.INSTALLING_ASSIGNING]: {
    label: '安装中-分配中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [ORDER_STATUS.INSTALLING_PENDING_VISIT]: {
    label: '安装中-待上门',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [ORDER_STATUS.INSTALLING_PENDING_CONFIRMATION]: {
    label: '安装中-待确认',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  [ORDER_STATUS.DELIVERED]: {
    label: '已交付',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  
  // 财务阶段配置
  [ORDER_STATUS.PENDING_RECONCILIATION]: {
    label: '待对账',
    color: '#FF5722',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  [ORDER_STATUS.PENDING_INVOICE]: {
    label: '待开发票',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  [ORDER_STATUS.PENDING_PAYMENT]: {
    label: '待回款',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [ORDER_STATUS.COMPLETED]: {
    label: '已完成',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  
  // 异常状态配置
  [ORDER_STATUS.CANCELLED]: {
    label: '已取消',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  [ORDER_STATUS.SUSPENDED]: {
    label: '暂停',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  [ORDER_STATUS.EXCEPTION]: {
    label: '异常',
    color: '#F44336',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  }
}
