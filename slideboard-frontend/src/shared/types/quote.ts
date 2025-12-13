// 报价单主记录类型
export interface Quote {
  id: string
  quoteNo: string
  leadId?: string
  customerId?: string
  customerName?: string // Join or Computed
  projectName: string
  projectAddress: string
  salespersonId: string
  salespersonName?: string // Join or Computed
  currentVersionId?: string
  status: QuoteStatus
  createdAt: string
  updatedAt: string
  
  // Relations
  versions?: QuoteVersion[]
  currentVersion?: QuoteVersion
}

export type QuoteStatus = 'draft' | 'active' | 'won' | 'lost' | 'expired' | 'confirmed' | 'closed';

// 报价单版本类型
export interface QuoteVersion {
  id: string
  quoteId: string
  versionNumber: number
  versionSuffix?: string
  quoteNo: string
  totalAmount: number
  validUntil?: string
  status: QuoteVersionStatus
  remarks?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  
  // Relations
  items: QuoteItem[]
}

export type QuoteVersionStatus = 'draft' | 'presented' | 'rejected' | 'accepted' | 'published' | 'confirmed' | 'expired' | 'cancelled';

// 报价单项目类型
export interface QuoteItem {
  id: string
  quoteVersionId: string
  category: string
  space: string
  productName: string
  productId?: string
  variantId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
  imageUrl?: string
  width?: number
  height?: number
  unit?: string
  attributes?: Record<string, any>
  createdAt: string
}

// 报价单创建请求类型
export interface CreateQuoteRequest {
  leadId?: string
  customerId?: string
  projectName: string
  projectAddress?: string
  items?: CreateQuoteItemRequest[]
}

export interface CreateQuoteItemRequest {
  category?: string
  space?: string
  productName: string
  productId?: string
  variantId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
  imageUrl?: string
  width?: number
  height?: number
  unit?: string
  attributes?: Record<string, any>
}

// DTOs for Service Layer
export interface CreateQuoteDTO {
  leadId?: string;
  customerId?: string;
  projectName: string;
  projectAddress?: string;
  items: CreateQuoteItemDTO[];
}

export interface CreateQuoteItemDTO {
  category: string;
  space: string;
  productName: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  imageUrl?: string;
  attributes?: Record<string, any>;
}

export interface CreateQuoteVersionDTO {
  quoteId: string;
  versionSuffix?: string;
  totalAmount: number;
  remarks?: string;
  items: CreateQuoteItemDTO[];
}

export interface UpdateQuoteVersionDTO {
  versionId: string;
  status?: QuoteVersionStatus;
  remarks?: string;
  validUntil?: string;
  totalAmount?: number;
  items?: CreateQuoteItemDTO[];
}

// 报价单版本创建请求类型
export interface CreateQuoteVersionRequest {
  quoteId: string
  quoteNo?: string
  totalAmount: number
  items: CreateQuoteItemRequest[]
}

// 报价单版本更新请求类型
export interface UpdateQuoteVersionRequest {
  items?: CreateQuoteItemRequest[]
  totalAmount?: number
  validUntil?: string
  status?: QuoteVersionStatus
  remarks?: string
}

// 报价单版本转换为销售单请求类型
export interface ConvertQuoteVersionToOrderRequest {
  quoteVersionId: string
  orderDate: string
  expectedDeliveryDate?: string
  expectedInstallationDate?: string
}
