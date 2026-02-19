import { QuoteItem } from '@/shared/api/schema/quotes';

/**
 * 报价单 PDF 导出所需的数据结构
 * 包含客户信息、商品项、房间归组等用于生成打印视图的数据
 */
export interface QuotePdfData {
    quoteNo: string;
    createdAt: Date | string;
    totalAmount: string | number;
    discountAmount: string | number;
    finalAmount: string | number;
    deliveryAddress?: string | null;
    customer?: {
        name?: string | null;
        phone?: string | null;
        address?: string | null;
    } | null;
    items: QuoteItem[];
    rooms: {
        id: string;
        name: string;
    }[];
}

/**
 * 报价金额汇总组件数据
 */
export interface QuoteSummaryData {
    totalAmount: string | number;
    discountAmount: string | number;
    finalAmount: string | number;
}

/**
 * 房间视图组件 Props
 */
export interface RoomViewProps {
    items: QuoteItem[];
    rooms: { id: string; name: string }[];
    isEditable?: boolean;
}

/**
 * Excel 导入行数据结构
 * 对应 Excel 模板的列
 */
export interface ExcelImportRow {
    roomName: string;
    category: string;
    productName: string;
    width?: number;
    height?: number;
    quantity: number;
    unitPrice: number;
    remark?: string;
    [key: string]: unknown; // 允许其他扩展列
}

/**
 * Excel 导入错误信息
 */
export interface ImportError {
    row: number;
    message: string;
    data?: ExcelImportRow;
}

/**
 * 报价单版本对比项
 */
export interface VersionQuoteItem {
    id: string;
    productName: string;
    category?: string;
    unitPrice: string | number;
    quantity: string | number;
    subtotal: string | number;
    remark?: string;
    _roomName?: string;
}

/**
 * 报价单版本对比房间
 */
export interface VersionQuoteRoom {
    name: string;
    items: VersionQuoteItem[];
}

/**
 * 报价单版本对比数据结构
 */
export interface VersionQuote {
    id: string;
    version: number;
    totalAmount: string | number;
    discountAmount: string | number;
    finalAmount: string | number;
    items?: VersionQuoteItem[];
    rooms?: VersionQuoteRoom[];
}
