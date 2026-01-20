
export interface QuoteItem {
    productId: string;
    productType: 'CURTAIN' | 'ACCESSORY' | 'SERVICE';
    quantity: number;
    unitPrice: number;
    width?: number; // 窗帘宽度 (�?
    height?: number; // 窗帘高度 (�?
    fabricRatio?: number; // 褶皱倍率，默�?2.0
}

export interface QuoteContext {
    items: QuoteItem[];
    fees: {
        measurement: number;
        installation: number;
        freight: number;
        discount: number;
    };
}

export interface QuoteResult {
    totalItemsPrice: number; // 商品总额
    totalFees: number;       // 费用总额
    finalAmount: number;     // 最终报�?
    items: Array<QuoteItem & { subtotal: number }>; // 包含小计的明�?
}
