export type CurtainFormula = 'FIXED_HEIGHT' | 'FIXED_WIDTH';
export type WallpaperFormula = 'WALLPAPER' | 'WALLCLOTH';
export type HeaderType = 'WRAPPED' | 'ATTACHED';

/**
 * 替代方案（超高时计算多种解决方案）
 */
export interface AlternativeSolution {
    /** 方案名称 */
    name: string;
    /** 方案描述 */
    description: string;
    /** 帘头工艺 */
    headerType: HeaderType;
    /** 帘头损耗 (cm) */
    headerLoss: number;
    /** 底边损耗 (cm) */
    bottomLoss: number;
    /** 计算用料 (m) */
    quantity: number;
    /** 差价估算（相对于基准方案） */
    priceDiff: number;
    /** 是否推荐 */
    recommended?: boolean;
}

export interface CurtainDetails {
    formula: CurtainFormula;
    hFinished: number;
    wFinished: number;
    wCut: number;
    hCut: number;
    headerType: HeaderType;
}

export interface WallpaperDetails {
    formula: WallpaperFormula;
}

export type CalculatorDetails = CurtainDetails | WallpaperDetails;

export interface CalculatorResult {
    /** 计算用量 */
    quantity: number;
    /** 警告消息 */
    warnings: string[];
    /** 计算明细 */
    details: CalculatorDetails;
    /** 替代方案（超高时返回多方案对比） */
    alternatives?: AlternativeSolution[];
    /** 是否触发超高预警 */
    heightOverflow?: boolean;
}
