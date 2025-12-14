// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ==================== 外部集成类型 ====================

/**
 * 飞书报表数据值类型
 */
export type FeishuReportDataType = string | number | boolean | Date | Array<unknown> | Record<string, unknown>;

/**
 * 飞书报表数据
 */
export interface FeishuReportData {
  title: string
  content: string
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom'
  data: Record<string, FeishuReportDataType>
  recipients?: string[] // 飞书用户 ID
  webhookUrl?: string // 飞书机器人 Webhook
}

/**
 * 飞书消息发送响应
 */
export interface FeishuSendResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * 微信模板数据类型
 */
export interface WechatTemplateData {
  [key: string]: {
    value: string
    color?: string
  }
}

/**
 * 微信通知数据
 */
export interface WechatNotificationData {
  type: 'text' | 'markdown' | 'template'
  title?: string
  content: string
  templateId?: string
  toUsers?: string[] // 微信用户 OpenID
  data?: WechatTemplateData | Record<string, string> // 模板消息数据或普通文本数据
}

/**
 * 微信消息发送响应
 */
export interface WechatSendResponse {
  success: boolean
  messageId?: string
  error?: string
}

// ==================== 数据操作类型 ====================

/**
 * 批量操作结果
 */
export interface BulkOperationResult {
  success: number
  failed: number
  errors?: Array<{
    index: number
    message: string
  }>
}

/**
 * 数据导入结果
 */
export interface ImportResult {
  total: number
  success: number
  failed: number
  errors?: Array<{
    row: number
    field: string
    message: string
  }>
}

/**
 * 过滤条件类型
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'like' | 'ilike' | 'is_null' | 'is_not_null';

export type FilterValue = string | number | boolean | null | Array<string | number | boolean>;

export interface FilterCondition {
  operator: FilterOperator;
  value: FilterValue;
}

/**
 * 数据导出参数
 */
export interface ExportParams {
  format: 'csv' | 'excel' | 'pdf'
  filters?: Record<string, FilterCondition | FilterValue>
  columns?: string[]
  filename?: string
}

// ==================== 实时订阅类型 ====================

/**
 * 实时事件类型
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * 实时事件负载
 */
export interface RealtimePayload<T = unknown> {
  eventType: RealtimeEventType
  new: T | null
  old: T | null
  table: string
  schema: string
  commit_timestamp: string
}

// ==================== 统计报表类型 ====================

/**
 * 统计数据
 */
export interface Statistics {
  total: number
  increase?: number
  increaseRate?: number
  trend?: 'up' | 'down' | 'stable'
}

/**
 * 图表数据点
 */
export interface ChartDataPoint {
  label: string
  value: number
  date?: string
}

/**
 * 报表摘要
 */
export interface ReportSummary {
  period: string
  statistics: Record<string, Statistics>
  charts?: Record<string, ChartDataPoint[]>
  generatedAt: string
}