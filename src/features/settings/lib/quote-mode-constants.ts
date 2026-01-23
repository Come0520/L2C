/**
 * 快速报价字段定义（系统固定常量）
 * 
 * 这些常量可以在客户端和服务端共享使用
 * 字段编号对应需求文档中的字段 1-20
 */

/**
 * 快速报价字段定义
 */
export const QUOTE_FIELDS = [
    // 用户输入组 (User Input)
    { id: 'roomType', label: '空间', group: 'userInput', fieldNo: 1, default: true },
    { id: 'productSku', label: '商品型号', group: 'userInput', fieldNo: 2, default: true },

    // 商品信息组 (Product Info)
    { id: 'imageUrl', label: '商品图片', group: 'productInfo', fieldNo: 3, default: true },
    { id: 'fabricWidth', label: '幅宽', group: 'productInfo', fieldNo: 4, default: false },
    { id: 'material', label: '材质', group: 'productInfo', fieldNo: 5, default: false },
    { id: 'weight', label: '克重', group: 'productInfo', fieldNo: 6, default: false },
    { id: 'patternRepeat', label: '花距', group: 'productInfo', fieldNo: 7, default: false },

    // 尺寸与安装要求组 (Dimensions)
    { id: 'width', label: '测量宽度', group: 'dimensions', fieldNo: 8, default: true },
    { id: 'height', label: '测量高度', group: 'dimensions', fieldNo: 9, default: true },
    { id: 'openingStyle', label: '拉动形式', group: 'dimensions', fieldNo: 10, default: true },
    { id: 'installPosition', label: '安装位置', group: 'dimensions', fieldNo: 11, default: false },
    { id: 'groundClearance', label: '离地高度', group: 'dimensions', fieldNo: 12, default: false },

    // 金额与计算组 (Pricing)
    { id: 'foldRatio', label: '褶皱倍数', group: 'pricing', fieldNo: 13, default: false },
    { id: 'quantity', label: '数量', group: 'pricing', fieldNo: 14, default: true },
    { id: 'unitPrice', label: '单价', group: 'pricing', fieldNo: 15, default: true },
    { id: 'discount', label: '折扣', group: 'pricing', fieldNo: 16, default: false },
    { id: 'amount', label: '金额', group: 'pricing', fieldNo: 17, default: true },
    { id: 'attachments', label: '附件录入', group: 'pricing', fieldNo: 18, default: false },
    { id: 'subtotal', label: '行内小计', group: 'pricing', fieldNo: 19, default: false },

    // 备注信息组 (Remarks)
    { id: 'remarks', label: '备注', group: 'remarks', fieldNo: 20, default: false },
] as const;

/**
 * 字段分组定义
 */
export const FIELD_GROUPS = {
    userInput: { label: '用户输入组', order: 1 },
    productInfo: { label: '商品信息组', order: 2 },
    dimensions: { label: '尺寸与安装要求组', order: 3 },
    pricing: { label: '金额与计算组', order: 4 },
    remarks: { label: '备注信息组', order: 5 },
} as const;

/**
 * 快速报价模式配置类型
 */
export interface QuoteModeConfig {
    /** 默认模式：QUICK（快速）或 ADVANCED（高级） */
    defaultMode: 'QUICK' | 'ADVANCED';
    /** 快速模式下显示的字段 ID 列表 */
    quickModeFields: string[];
    /** 隐藏字段的默认值 */
    defaultValues: {
        installPosition: string;
        groundClearance: number;
        foldRatio: number;
    };
}

/**
 * 系统默认配置
 */
export const DEFAULT_QUOTE_MODE_CONFIG: QuoteModeConfig = {
    defaultMode: 'QUICK',
    quickModeFields: QUOTE_FIELDS.filter(f => f.default).map(f => f.id),
    defaultValues: {
        installPosition: 'CURTAIN_BOX', // 窗帘盒
        groundClearance: 2, // 2cm
        foldRatio: 2.0, // 默认褶皱倍数
    },
};
