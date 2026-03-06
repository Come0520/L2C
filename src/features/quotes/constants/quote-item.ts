export interface AdvancedAttributes {
    fabricWidth?: number; // 幅宽
    formula?: string; // 算料方式
    installPosition?: string; // 安装位置
    groundClearance?: number; // 离地高度
    openingStyle?: string; // 拉动方式
    headerType?: string; // 上带方式
    bottomType?: string; // 底边处理
    sideLoss?: number; // 边损
    bottomLoss?: number; // 底边损耗
    headerLoss?: number; // 帘头损耗
    customPanels?: { width: number }[]; // 自定义分片
    [key: string]: unknown;
}

export const INSTALL_POSITIONS = [
    { value: 'CURTAIN_BOX', label: '窗帘盒' },
    { value: 'INSIDE', label: '窗框内' },
    { value: 'OUTSIDE', label: '窗框外' },
];

export const FORMULA_OPTIONS = [
    { value: 'FIXED_HEIGHT', label: '定高' },
    { value: 'FIXED_WIDTH', label: '定宽' },
];

export const HEADER_TYPES = [
    { value: 'WRAPPED', label: '布包带' },
    { value: 'ATTACHED', label: '贴布带' },
];

export const BOTTOM_TYPES = [
    { value: 'STANDARD', label: '标准底边' },
    { value: 'WIDE', label: '宽底边' },
    { value: 'WEIGHTED', label: '铅坠底' },
];

export const OPENING_STYLES = [
    { value: 'SPLIT', label: '对开' },
    { value: 'SINGLE', label: '单向' },
    { value: 'CUSTOM', label: '指定分片' },
];
