'use client';

export const CURTAIN_QUOTE_FIELDS = [
    { id: 'roomType', label: 'Room Type', group: 'basic', required: true },
    { id: 'productSku', label: 'Product SKU', group: 'product', required: true },
    { id: 'width', label: 'Width', group: 'dimension', required: true },
    { id: 'height', label: 'Height', group: 'dimension', required: true },
    { id: 'openingStyle', label: 'Opening Style', group: 'dimension', required: true },
    { id: 'quantity', label: 'Quantity', group: 'price', required: true },
    { id: 'unitPrice', label: 'Unit Price', group: 'price', required: true },
    { id: 'amount', label: 'Amount', group: 'price', required: true },
    { id: 'remark', label: 'Remark', group: 'price', required: false },
    { id: 'attachments', label: 'Attachments', group: 'price', required: false }
] as const;

export const FIELD_GROUP_LABELS: Record<string, string> = {
    basic: 'Basic Info',
    product: 'Product Info',
    dimension: 'Dimensions',
    price: 'Price & Calculation',
};

export const DEFAULT_SIMPLE_MODE_FIELDS = [
    'roomType',
    'productSku',
    'imageUrl',
    'width',
    'height',
    'openingStyle',
    'quantity',
    'unitPrice',
    'amount',
];

export interface QuoteModeConfig {
    simpleModeFields: string[];
    customized: boolean;
    updatedAt?: string;
}

export const SYSTEM_DEFAULT_QUOTE_CONFIG: QuoteModeConfig = {
    simpleModeFields: DEFAULT_SIMPLE_MODE_FIELDS,
    customized: false,
};
