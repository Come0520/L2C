import { ProductCategory as QuoteCategory } from './constants';
import { Customer } from '@/shared/api/schema/types';

// Define types locally to avoid dependencies on incomplete files
export interface CurtainFabricFormData {
    fabricWidth?: number;
    fabricDirection?: 'HEIGHT' | 'WIDTH';
    patternRepeat?: number;
    [key: string]: any;
}

export interface AttachmentItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    [key: string]: any;
}

export type CurtainCalcWarning = string;

// 每个品类的表单数据结构
export interface CategoryFormData {
    items: ExtendedItem[];
    totalAmount: number;
    remark?: string;
}

/** 计算引擎返回的预览项类型 */
export interface HydratedItem {
    id: string;
    quoteId: string;
    productName: string;
    quantity: string | number;
    unitPrice: string | number;
    subtotal: string | number;
    unit?: string | null;
    roomId?: string | null;
    width?: string | number | null;
    height?: string | number | null;
    foldRatio?: string | number | null;
    installPosition?: string | null;
    openingStyle?: string | null;
    fabricWidth?: string | number | null;
    remark?: string | null;
    isAccessory?: boolean | null;
    parentItemId?: string | null;
}

/** 报价单完整嵌套结果 */
export interface HydratedQuote {
    id: string;
    category: QuoteCategory;
    finalAmount: string | number | null;
    remark?: string | null;
    items?: HydratedItem[];
    rooms?: Array<{ id: string; name: string }>;
    creator?: { name: string | null } | null;
}

/** 报价组合完整嵌套结构 */
export interface HydratedBundle {
    id: string;
    customerId?: string | null;
    customer?: Customer | null;
    quotes: HydratedQuote[];
}

/** 报价单标签页状态定义 */
export interface CategoryTabData {
    id: string;
    category: QuoteCategory;
    label: string;
    formData: CategoryFormData;
    subtotal: number;
    hasData: boolean;
}

/** 转换后的本地编辑项类型 */
export interface ExtendedItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    unit?: string;
    roomName?: string;
    width?: number;
    height?: number;
    installPosition?: string;
    openingStyle?: string;
    foldRatio?: number;
    groundClearance?: number;
    remark?: string;
    specs?: Partial<CurtainFabricFormData>;
    attachments?: AttachmentItem[];
    /** 计算引擎返回的预警信息 */
    warnings?: CurtainCalcWarning[];
}
