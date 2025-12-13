// 安装单状态常量定义
export const INSTALLATION_STATUS = {
  PENDING: 'pending', // 待分配
  ASSIGNING: 'assigning', // 分配中
  WAITING: 'waiting', // 待安装
  INSTALLING: 'installing', // 安装中
  CONFIRMING: 'confirming', // 待验收
  COMPLETED: 'completed', // 已完成
  CANCELLED: 'cancelled', // 已取消
  REWORK: 'rework' // 返工
} as const

export type InstallationStatus = typeof INSTALLATION_STATUS[keyof typeof INSTALLATION_STATUS]

// 安装单状态配置
export const INSTALLATION_STATUS_CONFIG: Record<InstallationStatus, { label: string; color: string; bgColor: string }> = {
  [INSTALLATION_STATUS.PENDING]: {
    label: '待分配',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100'
  },
  [INSTALLATION_STATUS.ASSIGNING]: {
    label: '分配中',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100'
  },
  [INSTALLATION_STATUS.WAITING]: {
    label: '待安装',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100'
  },
  [INSTALLATION_STATUS.INSTALLING]: {
    label: '安装中',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100'
  },
  [INSTALLATION_STATUS.CONFIRMING]: {
    label: '待验收',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100'
  },
  [INSTALLATION_STATUS.COMPLETED]: {
    label: '已完成',
    color: 'text-green-800',
    bgColor: 'bg-green-100'
  },
  [INSTALLATION_STATUS.CANCELLED]: {
    label: '已取消',
    color: 'text-red-800',
    bgColor: 'bg-red-100'
  },
  [INSTALLATION_STATUS.REWORK]: {
    label: '返工',
    color: 'text-red-800',
    bgColor: 'bg-red-100'
  }
}

// 安装类型定义
export const INSTALLATION_TYPE = {
  STANDARD: 'standard',
  COMPLEX: 'complex',
  SUPPLEMENT: 'supplement',
  REPAIR: 'repair',
  MODIFICATION: 'modification'
} as const

export type InstallationType = typeof INSTALLATION_TYPE[keyof typeof INSTALLATION_TYPE]

export const INSTALLATION_TYPE_LABEL: Record<InstallationType, string> = {
  [INSTALLATION_TYPE.STANDARD]: '标准安装',
  [INSTALLATION_TYPE.COMPLEX]: '复杂安装',
  [INSTALLATION_TYPE.SUPPLEMENT]: '补装',
  [INSTALLATION_TYPE.REPAIR]: '维修安装',
  [INSTALLATION_TYPE.MODIFICATION]: '改装'
}
