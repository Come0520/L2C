// 报价状态类型定义
interface QuoteStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
}

// 报价状态常量定义
export const QUOTE_STATUS = {
  DRAFT: 'draft',                    // 草稿
  PRELIMINARY: 'preliminary',        // 初稿
  REVISED: 'revised',                // 再稿
  CONFIRMED: 'confirmed',            // 已确认
  EXPIRED: 'expired',                // 已过期
  CANCELLED: 'cancelled'             // 已取消
} as const

export type QuoteStatus = typeof QUOTE_STATUS[keyof typeof QUOTE_STATUS]

// 报价状态配置
export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, QuoteStatusConfig> = {
  [QUOTE_STATUS.DRAFT]: {
    label: '草稿',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  [QUOTE_STATUS.PRELIMINARY]: {
    label: '初稿',
    color: '#2196F3',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  [QUOTE_STATUS.REVISED]: {
    label: '再稿',
    color: '#FF9800',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200'
  },
  [QUOTE_STATUS.CONFIRMED]: {
    label: '已确认',
    color: '#4CAF50',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200'
  },
  [QUOTE_STATUS.EXPIRED]: {
    label: '已过期',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  },
  [QUOTE_STATUS.CANCELLED]: {
    label: '已取消',
    color: '#9E9E9E',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
}

// 报价状态流转规则
export const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QUOTE_STATUS.DRAFT]: [
    QUOTE_STATUS.PRELIMINARY,
    QUOTE_STATUS.CANCELLED
  ],
  [QUOTE_STATUS.PRELIMINARY]: [
    QUOTE_STATUS.REVISED,
    QUOTE_STATUS.CONFIRMED,
    QUOTE_STATUS.CANCELLED
  ],
  [QUOTE_STATUS.REVISED]: [
    QUOTE_STATUS.CONFIRMED,
    QUOTE_STATUS.PRELIMINARY,
    QUOTE_STATUS.CANCELLED
  ],
  [QUOTE_STATUS.CONFIRMED]: [
    QUOTE_STATUS.EXPIRED,
    QUOTE_STATUS.CANCELLED
  ],
  [QUOTE_STATUS.EXPIRED]: [
    QUOTE_STATUS.DRAFT,
    QUOTE_STATUS.CANCELLED
  ],
  [QUOTE_STATUS.CANCELLED]: []
}
