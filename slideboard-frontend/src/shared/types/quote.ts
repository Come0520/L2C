// 报价单主记录类型
export interface Quote {
  id: string
  customerId: string
  customerName: string
  projectName: string
  projectAddress: string
  salespersonId: string
  salespersonName: string
  currentVersion: number
  createdAt: string
  updatedAt: string
  versions: QuoteVersion[]
}

// 报价单版本类型
export interface QuoteVersion {
  id: string
  quoteId: string
  version: number
  quoteNo: string
  totalAmount: number
  validUntil: string
  status: 'draft' | 'preliminary' | 'revised' | 'confirmed' | 'cancelled'
  convertedToOrderId?: string
  poNumber?: string
  homeScreenshotUrl?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  items: QuoteItem[]
}

// 报价单项目类型
export interface QuoteItem {
  id: string
  quoteVersionId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
  specification?: string
}

// 报价单版本状态类型
export type QuoteVersionStatus = QuoteVersion['status']

// 报价单创建请求类型
export interface CreateQuoteRequest {
  customerId: string
  projectName: string
  projectAddress: string
  salespersonId: string
  items: Omit<QuoteItem, 'id' | 'quoteVersionId' | 'totalPrice'>[]
}

// 报价单版本创建请求类型
export interface CreateQuoteVersionRequest {
  quoteId: string
  baseVersionId?: string // 基于哪个版本创建
  items: Omit<QuoteItem, 'id' | 'quoteVersionId' | 'totalPrice'>[]
}

// 报价单版本更新请求类型
export interface UpdateQuoteVersionRequest {
  items?: Omit<QuoteItem, 'id' | 'quoteVersionId' | 'totalPrice'>[]
  validUntil?: string
  status?: QuoteVersionStatus
}

// 报价单版本转换为销售单请求类型
export interface ConvertQuoteVersionToOrderRequest {
  quoteVersionId: string
  orderDate: string
  expectedDeliveryDate?: string
  expectedInstallationDate?: string
}
