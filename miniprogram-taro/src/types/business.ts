/**
 * 核心业务实体类型定义
 * 与后端 API `/src/app/api/miniprogram` 返回格式保持一致
 */

// ===================== 通用 =====================

export interface PaginationResponse<T> {
    data: T[]
    total: number
}

// ===================== 客户/关联信息 =====================

export interface UserInfo {
    id: string
    name: string
    phone?: string
}

export interface ChannelInfo {
    name: string
}

export interface Customer {
    id: string
    name: string
    phone: string
    wechat?: string | null
    address?: string | null
    source?: string | null
    remark?: string | null
}

// ===================== 线索 (Leads) =====================

export interface Lead {
    id: string
    leadNo: string
    customerName: string
    customerPhone: string
    customerWechat?: string | null
    community: string
    houseType: string
    address?: string | null
    intentionLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL'
    status: 'PENDING_FOLLOWUP' | 'FOLLOWING' | 'QUOTED' | 'LOST' | 'CONVERTED' | 'ALL'
    createdAt: string
    updatedAt?: string
    lastFollowUpAt?: string
    notes?: string | null
    assignedSales?: { name: string } | null
    sourceChannel?: { name: string } | null
    sourceSub?: { name: string } | null
}

// ===================== 报价单 (Quotes) =====================

export interface QuoteItem {
    id: string
    productName: string
    roomName: string
    quantity: number
    unit: string
    unitPrice: string | number
    subtotal: string | number
    attributes?: Record<string, any>
}

export interface QuoteVersion {
    id: string
    version: number
    status: string
    createdAt: string
}

export interface Quote {
    id: string
    quoteNo: string
    title: string
    customerName: string
    totalAmount: string | number
    finalAmount: string | number
    status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED'
    customerSignatureUrl?: string | null
    confirmedAt?: string | null
    items: QuoteItem[]
    versions?: QuoteVersion[]
}

// ===================== 任务 (Tasks) =====================

export interface TaskCustomer {
    name?: string
    phone?: string
}

export interface MeasureTask {
    id: string
    measureNo: string
    status: 'PENDING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED'
    scheduledAt?: string | null
    type: 'LEAD_BASED' | 'QUOTE_BASED' | 'AFTER_SALES'
    laborFee?: string | number | null
    remark?: string | null
    createdAt: string
    customerName?: string | null
    customerPhone?: string | null
    customer?: Customer
    sheets?: Record<string, any>[]
    laborFeeRule?: {
        unitType: string
        unitPrice: string | number
        baseFee: string | number
    } | null
    quoteSummary?: {
        quoteNo: string
        rooms: Array<{ roomName: string; items: any[] }>
    } | null
}

export interface InstallTask {
    id: string
    taskNo: string
    status: 'PENDING_DISPATCH' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED'
    category: 'DEFAULT' | 'AFTER_SALES' | 'REPAIR'
    scheduledDate?: string | null
    scheduledTimeSlot?: string | null
    remark?: string | null
    notes?: string | null
    createdAt: string
    customerName?: string | null
    customerPhone?: string | null
    address?: string | null
}

// 供列表展示的联合类型
export interface TasksListResponse {
    measureTasks: MeasureTask[]
    installTasks: InstallTask[]
}

// ===================== 订单 (Orders) =====================

export interface OrderItem {
    id: string
    productName: string
    category: string
    quantity: string | number
    unitPrice: string | number
    subtotal: string | number
    status: string
}

export interface PaymentSchedule {
    id: string
    name: string
    amount: string | number
    actualAmount?: string | number | null
    expectedDate?: string | null
    status: 'PENDING' | 'PAID'
}

export interface Order {
    id: string
    orderNo: string
    customerName: string
    customerPhone: string
    deliveryAddress?: string | null
    totalAmount: string | number
    paidAmount: string | number
    balanceAmount: string | number
    status: string
    remark?: string | null
    createdAt: string
    updatedAt: string
    items?: OrderItem[]
    paymentSchedules?: PaymentSchedule[]
}

// ===================== 结算 (Settlement) =====================

export interface EarningsRecord {
    id: string
    description: string | null
    amount: string | null
    feeType: string | null
    installTaskNo: string | null
    createdAt: string | null
}

export interface EarningsSummary {
    totalEarned: string
    pendingAmount: string
    recentDetails: EarningsRecord[]
}

// ===================== 售后 (After-Sales) =====================

export interface ServiceTicket {
    id: string
    ticketNo: string
    orderId: string
    type: 'REPAIR' | 'RETURN' | 'EXCHANGE' | 'COMPLAINT' | 'CONSULTATION'
    description: string
    status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'CLOSED'
    createdAt: string
}
