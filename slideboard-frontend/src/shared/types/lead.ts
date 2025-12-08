// 导入自动生成的 API 类型
import { components } from './api-schema'

export type LeadDetail = Required<components['schemas']['LeadDetail']>

export interface LeadItem extends Omit<LeadDetail, 'customerLevel' | 'status' | 'businessTags' | 'appointmentReminder' | 'constructionProgress'> {
  customerLevel: 'A' | 'B' | 'C' | 'D'
  status:
  | 'PENDING_ASSIGNMENT' // 待分配
  | 'PENDING_FOLLOW_UP' // 待跟踪
  | 'FOLLOWING_UP' // 跟踪中
  | 'DRAFT_SIGNED' // 草签
  | 'EXPIRED' // 已失效
  | 'PENDING_MEASUREMENT' // 待测量
  | 'MEASURING_PENDING_ASSIGNMENT' // 测量中-待分配
  | 'MEASURING_ASSIGNING' // 测量中-分配中
  | 'MEASURING_PENDING_VISIT' // 测量中-待上门
  | 'MEASURING_PENDING_CONFIRMATION' // 测量中-待确认
  | 'PLAN_PENDING_CONFIRMATION' // 方案待确认
  | 'PENDING_PUSH' // 待推单
  | 'PENDING_ORDER' // 待下单
  | 'IN_PRODUCTION' // 生产中
  | 'STOCK_PREPARED' // 备货完成
  | 'PENDING_SHIPMENT' // 待发货
  | 'INSTALLING_PENDING_ASSIGNMENT' // 安装中-待分配
  | 'INSTALLING_ASSIGNING' // 安装中-分配中
  | 'INSTALLING_PENDING_VISIT' // 安装中-待上门
  | 'INSTALLING_PENDING_CONFIRMATION' // 安装中-待确认
  | 'PENDING_RECONCILIATION' // 待对账
  | 'PENDING_INVOICE' // 待开发票
  | 'PENDING_PAYMENT' // 待回款
  | 'COMPLETED' // 已完成
  | 'CANCELLED' // 已取消
  | 'PAUSED' // 暂停
  | 'ABNORMAL' // 异常
  businessTags: Array<'quoted' | 'arrived' | 'appointment' | 'high-intent' | 'measured'>
  appointmentReminder?: '48h' | '24h' | null
  constructionProgress?: 'just-signed' | 'plumbing' | 'masonry' | 'painting' | 'installation' | 'stalled'
}

export interface LeadStatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  visibleTo?: string[]
  actions?: LeadAction[]
}

export interface LeadAction {
  key: string
  label: string
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning'
  permission?: string[]
  confirmRequired?: boolean
}

export interface LeadFilter {
  searchTerm: string
  status: string
  businessTags: string[]
  source: string
  owner: string
  designer: string
  shoppingGuide: string
  customerLevel: string
  dateRange: {
    start: string
    end: string
  }
}

export interface AppointmentCalendarItem {
  date: string
  appointments: {
    time: string
    customerName: string
    requirement: string
    level: string
  }[]
  count: number
}

export interface FollowUpRecord {
  id: string
  leadId: string
  type: 'text' | 'voice' | 'image'
  content: string
  result: 'interested' | 'not-interested' | 'follow-up'
  note?: string
  nextFollowUpTime?: string
  appointmentTime?: string
  createdAt: string
  createdBy: string
}

export interface LeadAssignment {
  leadId: string
  assigneeId: string
  method: 'manual' | 'auto'
  reason?: string
  createdAt: string
  createdBy: string
}
export interface LeadDuplicateRecord {
  id: string
  customer_name: string
  phone: string
  project_address?: string
  lead_number: string
  created_at: string
}
