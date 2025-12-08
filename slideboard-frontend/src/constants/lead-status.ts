import { LeadStatusConfig } from '@/types/lead'

export const LEAD_STATUS_CONFIG: Record<string, LeadStatusConfig> = {
  // 线索阶段
  PENDING_ASSIGNMENT: {
    label: '待分配',
    color: '#FF5722',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    visibleTo: ['LEAD_SALES', 'SALES_CHANNEL', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'assign',
        label: '分配',
        variant: 'primary',
        permission: ['LEAD_SALES', 'SALES_CHANNEL'],
        confirmRequired: true
      },
      {
        key: 'confirm_track',
        label: '跟踪',
        variant: 'primary',
        permission: ['LEAD_SALES', 'SALES_CHANNEL']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['LEAD_SALES', 'SALES_CHANNEL', 'LEAD_ADMIN']
      }
    ]
  },
  PENDING_FOLLOW_UP: {
    label: '待跟踪',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'confirm_track',
        label: '开始跟踪',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      }
    ]
  },
  FOLLOWING_UP: {
    label: '跟踪中',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'add_followup',
        label: '添加跟踪记录',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      },
      {
        key: 'generate_quote',
        label: '生成报价单',
        variant: 'success',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      },
      {
        key: 'convert_to_draft_signed',
        label: '转为草签',
        variant: 'success',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES'],
        confirmRequired: true
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      }
    ]
  },
  DRAFT_SIGNED: {
    label: '草签',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'OTHER_CUSTOMER'],
    actions: [
      {
        key: 'arrange_measurement',
        label: '安排测量',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      }
    ]
  },
  EXPIRED: {
    label: '已失效',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'SALES_CHANNEL', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'view_reason',
        label: '查看原因',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'SALES_CHANNEL', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL']
      },
      {
        key: 'reactivate',
        label: '重新激活',
        variant: 'warning',
        permission: ['LEAD_SALES', 'SALES_CHANNEL', 'LEAD_ADMIN'],
        confirmRequired: true
      }
    ]
  },
  
  // 测量阶段
  PENDING_MEASUREMENT: {
    label: '待测量',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'SERVICE_DISPATCH', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'go_to_measure',
        label: '去测量',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN']
      }
    ]
  },
  MEASURING_PENDING_ASSIGNMENT: {
    label: '测量中-待分配',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    visibleTo: ['SERVICE_DISPATCH', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'assign_measurer',
        label: '分配测量师',
        variant: 'primary',
        permission: ['SERVICE_DISPATCH', 'LEAD_ADMIN']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['LEAD_SALES', 'LEAD_ADMIN']
      }
    ]
  },
  MEASURING_ASSIGNING: {
    label: '测量中-分配中',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    visibleTo: ['SERVICE_DISPATCH', 'SERVICE_MEASURE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'accept_measurement',
        label: '接单确认',
        variant: 'primary',
        permission: ['SERVICE_MEASURE']
      },
      {
        key: 'reject_measurement',
        label: '拒绝测量',
        variant: 'outline',
        permission: ['SERVICE_MEASURE']
      },
      {
        key: 'reassign_measurer',
        label: '重新分配',
        variant: 'warning',
        permission: ['SERVICE_DISPATCH', 'LEAD_ADMIN']
      }
    ]
  },
  MEASURING_PENDING_VISIT: {
    label: '测量中-待上门',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    visibleTo: ['SERVICE_MEASURE', 'SERVICE_DISPATCH', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'complete_measurement',
        label: '完成测量',
        variant: 'primary',
        permission: ['SERVICE_MEASURE']
      },
      {
        key: 'update_measurement_status',
        label: '更新状态',
        variant: 'outline',
        permission: ['SERVICE_MEASURE', 'SERVICE_DISPATCH']
      }
    ]
  },
  MEASURING_PENDING_CONFIRMATION: {
    label: '测量中-待确认',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'SERVICE_MEASURE', 'SERVICE_DISPATCH', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'confirm_measurement',
        label: '确认测量结果',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      },
      {
        key: 'reject_measurement',
        label: '驳回测量结果',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      }
    ]
  },
  PLAN_PENDING_CONFIRMATION: {
    label: '方案待确认',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'PARTNER_DESIGNER', 'OTHER_CUSTOMER', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'confirm_plan',
        label: '确认方案',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'OTHER_CUSTOMER']
      },
      {
        key: 'reject_plan',
        label: '驳回方案',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'OTHER_CUSTOMER']
      },
      {
        key: 'update_plan',
        label: '更新方案',
        variant: 'warning',
        permission: ['PARTNER_DESIGNER', 'SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      }
    ]
  },
  
  // 订单处理阶段
  PENDING_PUSH: {
    label: '待推单',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'push_order',
        label: '推单',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN']
      }
    ]
  },
  PENDING_ORDER: {
    label: '待下单',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'DELIVERY_SERVICE', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'approve_order',
        label: '审核通过',
        variant: 'primary',
        permission: ['DELIVERY_SERVICE']
      },
      {
        key: 'reject_order',
        label: '驳回',
        variant: 'outline',
        permission: ['DELIVERY_SERVICE']
      }
    ]
  },
  IN_PRODUCTION: {
    label: '生产中',
    color: '#607D8B',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'DELIVERY_SERVICE', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'update_production_status',
        label: '更新生产状态',
        variant: 'outline',
        permission: ['DELIVERY_SERVICE', 'LEAD_SALES']
      }
    ]
  },
  STOCK_PREPARED: {
    label: '备货完成',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'DELIVERY_SERVICE', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'ship_all',
        label: '整单发货',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES']
      }
    ]
  },
  PENDING_SHIPMENT: {
    label: '待发货',
    color: '#FF5722',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'DELIVERY_SERVICE', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'fill_tracking_number',
        label: '填写快递单号',
        variant: 'primary',
        permission: ['DELIVERY_SERVICE']
      }
    ]
  },
  
  // 安装阶段
  INSTALLING_PENDING_ASSIGNMENT: {
    label: '安装中-待分配',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    visibleTo: ['SERVICE_DISPATCH', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'assign_installer',
        label: '分配安装师',
        variant: 'primary',
        permission: ['SERVICE_DISPATCH', 'LEAD_ADMIN']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['LEAD_SALES', 'LEAD_ADMIN']
      }
    ]
  },
  INSTALLING_ASSIGNING: {
    label: '安装中-分配中',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    visibleTo: ['SERVICE_DISPATCH', 'SERVICE_INSTALL', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'accept_installation',
        label: '接单确认',
        variant: 'primary',
        permission: ['SERVICE_INSTALL']
      },
      {
        key: 'reject_installation',
        label: '拒绝安装',
        variant: 'outline',
        permission: ['SERVICE_INSTALL']
      },
      {
        key: 'reassign_installer',
        label: '重新分配',
        variant: 'warning',
        permission: ['SERVICE_DISPATCH', 'LEAD_ADMIN']
      },
      {
        key: 'close_lead',
        label: '关闭',
        variant: 'outline',
        permission: ['LEAD_SALES', 'LEAD_ADMIN']
      }
    ]
  },
  INSTALLING_PENDING_VISIT: {
    label: '安装中-待上门',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    visibleTo: ['SERVICE_INSTALL', 'SERVICE_DISPATCH', 'LEAD_SALES', 'OTHER_CUSTOMER', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'complete_installation',
        label: '完成安装',
        variant: 'primary',
        permission: ['SERVICE_INSTALL']
      },
      {
        key: 'update_installation_status',
        label: '更新状态',
        variant: 'outline',
        permission: ['SERVICE_INSTALL', 'SERVICE_DISPATCH']
      }
    ]
  },
  INSTALLING_PENDING_CONFIRMATION: {
    label: '安装中-待确认',
    color: '#9C27B0',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'SERVICE_INSTALL', 'OTHER_CUSTOMER', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'upload_installation_photos',
        label: '上传安装图片',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'SERVICE_INSTALL']
      },
      {
        key: 'approve_installation',
        label: '审核安装结果',
        variant: 'success',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'OTHER_CUSTOMER']
      },
      {
        key: 'reject_installation',
        label: '驳回安装结果',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'OTHER_CUSTOMER']
      }
    ]
  },
  
  // 财务阶段
  PENDING_RECONCILIATION: {
    label: '待对账',
    color: '#FF5722',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    visibleTo: ['OTHER_FINANCE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'reconcile_order',
        label: '订单对账',
        variant: 'primary',
        permission: ['OTHER_FINANCE']
      }
    ]
  },
  PENDING_INVOICE: {
    label: '待开发票',
    color: '#FFC107',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    visibleTo: ['OTHER_FINANCE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'issue_invoice',
        label: '开具发票',
        variant: 'primary',
        permission: ['OTHER_FINANCE']
      }
    ]
  },
  PENDING_PAYMENT: {
    label: '待回款',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    visibleTo: ['OTHER_FINANCE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'confirm_payment',
        label: '回款确认',
        variant: 'primary',
        permission: ['OTHER_FINANCE']
      }
    ]
  },
  COMPLETED: {
    label: '已完成',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'OTHER_FINANCE', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'OTHER_CUSTOMER'],
    actions: [
      {
        key: 'view_details',
        label: '查看详情',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'OTHER_FINANCE', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'OTHER_CUSTOMER']
      }
    ]
  },
  
  // 异常状态
  CANCELLED: {
    label: '已取消',
    color: '#F44336',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'OTHER_CUSTOMER'],
    actions: [
      {
        key: 'view_cancellation_reason',
        label: '查看取消原因',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL', 'OTHER_CUSTOMER']
      }
    ]
  },
  PAUSED: {
    label: '暂停',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'resume_lead',
        label: '恢复',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN']
      },
      {
        key: 'view_pause_reason',
        label: '查看暂停原因',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL']
      }
    ]
  },
  ABNORMAL: {
    label: '异常',
    color: '#F44336',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    visibleTo: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL'],
    actions: [
      {
        key: 'resolve_abnormality',
        label: '处理异常',
        variant: 'primary',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN']
      },
      {
        key: 'view_abnormality_reason',
        label: '查看异常原因',
        variant: 'outline',
        permission: ['SALES_STORE', 'SALES_REMOTE', 'LEAD_SALES', 'LEAD_ADMIN', 'LEAD_CHANNEL', 'LEAD_GENERAL']
      }
    ]
  }
}

export const BUSINESS_TAG_CONFIG = {
  quoted: {
    label: '已报价',
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  arrived: {
    label: '已到店',
    color: 'green',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  appointment: {
    label: '预约到店',
    color: 'blue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  'high-intent': {
    label: '高意向',
    color: 'red',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  measured: {
    label: '已测量',
    color: 'purple',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  }
}

export const CUSTOMER_LEVEL_CONFIG = {
  A: {
    label: 'A级',
    color: 'red',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
  B: {
    label: 'B级',
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  C: {
    label: 'C级',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  D: {
    label: 'D级',
    color: 'gray',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
}

export const CONSTRUCTION_PROGRESS_CONFIG = {
  'just-signed': {
    label: '刚签',
    reminderDays: 30
  },
  plumbing: {
    label: '水电',
    reminderDays: 30
  },
  masonry: {
    label: '泥木',
    reminderDays: 30
  },
  painting: {
    label: '涂料',
    reminderDays: 15
  },
  installation: {
    label: '安装',
    reminderDays: 7
  },
  stalled: {
    label: '停滞',
    reminderDays: 7
  }
}

// 时效控制配置
export const LEAD_STATUS_TIMELIMIT_CONFIG = {
  // 线索阶段时效配置
  PENDING_ASSIGNMENT: {
    timeLimitHours: 24, // 24小时内必须分配
    reminderHours: 12, // 12小时时提醒
    timeoutAction: 'alert', // 超时后报警
    timeoutPenalty: {
      48: 5, // 超过48小时扣5分
      72: 10 // 超过72小时扣10分
    }
  },
  PENDING_FOLLOW_UP: {
    timeLimitHours: 72, // 72小时内必须开始跟踪
    reminderHours: 48, // 48小时时提醒
    timeoutAction: 'alert', // 超时后报警
    timeoutPenalty: {
      96: 'alert_manager', // 超过96小时预警给领导
      120: { penalty: 5, action: 'return' } // 超过120小时扣5分，退回待分配
    }
  },
  FOLLOWING_UP: {
    timeLimitHours: 720, // 30天内必须完成跟踪
    reminderHours: 672, // 28天时提醒
    timeoutAction: 'alert', // 超时后报警
    timeoutPenalty: {
      1008: 5 // 超过42天扣5分
    }
  },
  // 补充与ORDER_STATUS一致的状态命名
  PENDING_TRACKING: {
    timeLimitHours: 72, // 72小时内必须开始跟踪
    reminderHours: 48, // 48小时时提醒
    timeoutAction: 'alert', // 超时后报警
    timeoutPenalty: {
      96: 'alert_manager', // 超过96小时预警给领导
      120: { penalty: 5, action: 'return' } // 超过120小时扣5分，退回待分配
    }
  },
  TRACKING: {
    timeLimitHours: 720, // 30天内必须完成跟踪
    reminderHours: 672, // 28天时提醒
    timeoutAction: 'alert', // 超时后报警
    timeoutPenalty: {
      1008: 5 // 超过42天扣5分
    }
  },
  DRAFT_SIGNED: {
    timeLimitHours: 72, // 72小时内必须生成报价单
    reminderHours: 48, // 48小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  EXPIRED: {
    timeLimitHours: 0, // 无时效要求
    reminderHours: 0,
    timeoutAction: 'none'
  },
  
  // 测量阶段时效配置
  PENDING_MEASUREMENT: {
    timeLimitHours: 48, // 48小时内必须点击"去测量"
    reminderHours: 24, // 24小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  MEASURING_PENDING_ASSIGNMENT: {
    timeLimitHours: 4, // 4小时内必须分配测量师
    reminderHours: 2, // 2小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  MEASURING_ASSIGNING: {
    timeLimitHours: 2, // 2小时内必须接单确认
    reminderHours: 1, // 1小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  MEASURING_PENDING_VISIT: {
    timeLimitHours: 48, // 48小时内必须完成上门测量
    reminderHours: 24, // 24小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  MEASURING_PENDING_CONFIRMATION: {
    timeLimitHours: 48, // 48小时内必须确认或驳回
    reminderHours: 24, // 24小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  PLAN_PENDING_CONFIRMATION: {
    timeLimitHours: 72, // 72小时内必须和客户达成共识
    reminderHours: 48, // 48小时时提醒
    timeoutAction: 'alert' // 超时后报警
  },
  
  // 订单处理阶段时效配置
  PENDING_PUSH: {
    timeLimitHours: 0, // 无时效要求
    reminderHours: 0,
    timeoutAction: 'none'
  },
  PENDING_ORDER: {
    timeLimitHours: 48, // 48小时内必须完成审核
    reminderHours: 24, // 24小时时提醒
    timeoutAction: 'alert' // 超时后提醒
  },
  IN_PRODUCTION: {
    timeLimitHours: 0, // 根据产品类型设定
    reminderHours: 0,
    timeoutAction: 'none'
  },
  STOCK_PREPARED: {
    timeLimitHours: 24, // 24小时内必须点击"整单发货"
    reminderHours: 12, // 12小时时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  PENDING_SHIPMENT: {
    timeLimitHours: 24, // 24小时内必须填写所有快递单号
    reminderHours: 12, // 12小时时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  
  // 安装阶段时效配置
  INSTALLING_PENDING_ASSIGNMENT: {
    timeLimitHours: 4, // 4小时内必须分配安装师
    reminderHours: 2, // 2小时时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  INSTALLING_ASSIGNING: {
    timeLimitHours: 2, // 2小时内必须接单或拒绝接单
    reminderHours: 1, // 1小时时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  INSTALLING_PENDING_VISIT: {
    timeLimitHours: 168, // 7天内必须完成上门安装
    reminderHours: 72, // 3天时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  INSTALLING_PENDING_CONFIRMATION: {
    timeLimitHours: 24, // 24小时内必须完成安装图片上传和截图上传
    reminderHours: 12, // 12小时时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  
  // 财务阶段时效配置
  PENDING_RECONCILIATION: {
    timeLimitHours: 72, // 3个工作日内必须完成对账
    reminderHours: 48, // 2个工作日时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  PENDING_INVOICE: {
    timeLimitHours: 72, // 3个工作日内必须完成开票
    reminderHours: 48, // 2个工作日时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  PENDING_PAYMENT: {
    timeLimitHours: 720, // 30天内必须完成回款确认
    reminderHours: 360, // 15天时提醒
    timeoutAction: 'alert' // 超时后提醒/报警
  },
  COMPLETED: {
    timeLimitHours: 0, // 无时效要求
    reminderHours: 0,
    timeoutAction: 'none'
  },
  
  // 异常状态时效配置
  CANCELLED: {
    timeLimitHours: 0, // 无时效要求
    reminderHours: 0,
    timeoutAction: 'none'
  },
  PAUSED: {
    timeLimitHours: 0, // 无时效要求
    reminderHours: 0,
    timeoutAction: 'none'
  },
  ABNORMAL: {
    timeLimitHours: 0, // 无时效要求
    reminderHours: 0,
    timeoutAction: 'none'
  },
  // 补充与ORDER_STATUS一致的异常状态命名
  SUSPENDED: {
    timeLimitHours: 72, // 72小时内必须处理暂停状态
    reminderHours: 48, // 48小时时提醒
    timeoutAction: 'alert', // 超时后提醒
    timeoutPenalty: {
      96: 'alert_manager', // 超过96小时预警给领导
      120: 5 // 超过120小时扣5分
    }
  },
  EXCEPTION: {
    timeLimitHours: 48, // 48小时内必须处理异常状态
    reminderHours: 24, // 24小时时提醒
    timeoutAction: 'alert', // 超时后提醒
    timeoutPenalty: {
      72: 'alert_manager', // 超过72小时预警给领导
      96: 10 // 超过96小时扣10分
    }
  }
}

// 产品生产周期配置
export const PRODUCT_PRODUCTION_CYCLE = {
  'curtain': 7, // 窗帘7天
  'track': 3, // 轨道3天
  'wall-cloth': 15, // 墙咔15天
  'wallpaper': 7 // 墙布7天
}
