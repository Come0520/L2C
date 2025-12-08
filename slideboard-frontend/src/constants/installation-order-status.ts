// 安装单状态定义
export const INSTALLATION_STATUS = {
  PENDING: 'pending',
  ASSIGNING: 'assigning',
  WAITING: 'waiting',
  INSTALLING: 'installing',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REWORK: 'rework'
} as const

export type InstallationStatus = typeof INSTALLATION_STATUS[keyof typeof INSTALLATION_STATUS]

// 安装单状态配置
export const INSTALLATION_STATUS_CONFIG = {
  [INSTALLATION_STATUS.PENDING]: {
    label: '待安排',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300'
  },
  [INSTALLATION_STATUS.ASSIGNING]: {
    label: '分配中',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300'
  },
  [INSTALLATION_STATUS.WAITING]: {
    label: '待上门',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300'
  },
  [INSTALLATION_STATUS.INSTALLING]: {
    label: '安装中',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300'
  },
  [INSTALLATION_STATUS.CONFIRMING]: {
    label: '待验收',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300'
  },
  [INSTALLATION_STATUS.COMPLETED]: {
    label: '已完成',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    borderColor: 'border-emerald-300'
  },
  [INSTALLATION_STATUS.CANCELLED]: {
    label: '已取消',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300'
  },
  [INSTALLATION_STATUS.REWORK]: {
    label: '返工',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-300'
  }
} as const

// 安装类型映射
export const installationTypeMap = {
  'standard': '标准安装',
  'complex': '复杂安装',
  'supplement': '补装',
  'repair': '维修安装',
  'modification': '改装'
} as const

// 验收状态映射
export const acceptanceStatusMap = {
  'pending': {
    label: '待验收',
    color: 'bg-yellow-100 text-yellow-800'
  },
  'passed': {
    label: '验收通过',
    color: 'bg-green-100 text-green-800'
  },
  'failed': {
    label: '验收失败',
    color: 'bg-red-100 text-red-800'
  },
  'partial': {
    label: '部分通过',
    color: 'bg-orange-100 text-orange-800'
  }
} as const

// 安装状态流转规则
export const INSTALLATION_STATUS_TRANSITIONS = {
  [INSTALLATION_STATUS.PENDING]: [
    INSTALLATION_STATUS.ASSIGNING,
    INSTALLATION_STATUS.CANCELLED
  ],
  [INSTALLATION_STATUS.ASSIGNING]: [
    INSTALLATION_STATUS.WAITING,
    INSTALLATION_STATUS.CANCELLED
  ],
  [INSTALLATION_STATUS.WAITING]: [
    INSTALLATION_STATUS.INSTALLING,
    INSTALLATION_STATUS.CANCELLED
  ],
  [INSTALLATION_STATUS.INSTALLING]: [
    INSTALLATION_STATUS.CONFIRMING,
    INSTALLATION_STATUS.REWORK,
    INSTALLATION_STATUS.CANCELLED
  ],
  [INSTALLATION_STATUS.CONFIRMING]: [
    INSTALLATION_STATUS.COMPLETED,
    INSTALLATION_STATUS.REWORK,
    INSTALLATION_STATUS.CANCELLED
  ],
  [INSTALLATION_STATUS.REWORK]: [
    INSTALLATION_STATUS.INSTALLING,
    INSTALLATION_STATUS.CANCELLED
  ],
  [INSTALLATION_STATUS.COMPLETED]: [],
  [INSTALLATION_STATUS.CANCELLED]: []
} as const
