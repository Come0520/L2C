/**
 * 窗帘/墙纸计算引擎 (Curtain/Wallpaper Calculator)
 * 支持智能方案对比和租户配置
 */

// ============ 类型定义 ============

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

/**
 * 窗帘计算参数
 */
export interface CurtainParams {
    /** 测量宽度 (cm) */
    measuredWidth: number;
    /** 测量高度 (cm) */
    measuredHeight: number;
    /** 褶皱倍数 */
    foldRatio: number;
    /** 面料幅宽 (cm) */
    fabricWidth: number;
    /** 计算公式 */
    formula: CurtainFormula;

    // 损耗配置
    /** 侧边损耗 (cm) */
    sideLoss?: number;
    /** 底边损耗 (cm) */
    bottomLoss?: number;
    /** 包布带帘头损耗 (cm) */
    headerLossWrapped?: number;
    /** 贴布带帘头损耗 (cm) */
    headerLossAttached?: number;
    /** 当前使用的帘头工艺 */
    headerType?: HeaderType;
    /** 定高阈值 (cm) */
    heightWarningThreshold?: number;

    // 兼容旧版
    headerLoss?: number;

    /** 开合方式 */
    splitType?: 'SINGLE' | 'DOUBLE' | 'MULTI';
    /** 单价（用于计算差价） */
    unitPrice?: number;
}

export interface WallpaperParams {
    measuredWidth: number;
    measuredHeight: number;
    productWidth: number;
    rollLength?: number;
    patternRepeat?: number;
    formula: WallpaperFormula;
    widthLoss?: number;
    cutLoss?: number;
}

// ============ 默认值（仅作为后备，优先使用配置传入） ============

const DEFAULTS = {
    SIDE_LOSS: 5,
    BOTTOM_LOSS: 10,
    HEADER_LOSS_WRAPPED: 20,
    HEADER_LOSS_ATTACHED: 7,
    WIDTH_LOSS: 20,
    CUT_LOSS: 10,
    HEIGHT_WARNING_THRESHOLD: 275,
};

// ============ 窗帘计算器 ============

export const CurtainCalculator = {
    /**
     * 计算窗帘用料
     */
    calculate(params: CurtainParams): CalculatorResult {
        const warnings: string[] = [];
        const {
            measuredWidth,
            measuredHeight,
            foldRatio,
            fabricWidth,
            formula,
            splitType = 'DOUBLE',
            unitPrice = 0,
        } = params;

        // [Fix] 处理 NaN 输入
        const safeParams = {
            measuredWidth: isNaN(measuredWidth) ? 0 : measuredWidth,
            measuredHeight: isNaN(measuredHeight) ? 0 : measuredHeight,
            foldRatio: isNaN(foldRatio) ? 2 : foldRatio,
        };
        const hFinished = safeParams.measuredHeight;
        const wFinished = safeParams.measuredWidth * safeParams.foldRatio;
        const sideLoss = params.sideLoss ?? DEFAULTS.SIDE_LOSS;
        const bottomLoss = params.bottomLoss ?? DEFAULTS.BOTTOM_LOSS;
        const headerLossWrapped = params.headerLossWrapped ?? params.headerLoss ?? DEFAULTS.HEADER_LOSS_WRAPPED;
        const headerLossAttached = params.headerLossAttached ?? DEFAULTS.HEADER_LOSS_ATTACHED;
        const headerType = params.headerType ?? 'WRAPPED';
        const _heightThreshold = params.heightWarningThreshold ?? DEFAULTS.HEIGHT_WARNING_THRESHOLD;

        // 根据当前工艺选择帘头损耗
        const currentHeaderLoss = headerType === 'WRAPPED' ? headerLossWrapped : headerLossAttached;

        // 1. 成品尺寸 (已在上方 safeParams 中计算)
        // const hFinished = measuredHeight;
        // const wFinished = measuredWidth * foldRatio;

        // 2. 裁剪尺寸
        const splitCount = splitType === 'SINGLE' ? 1 : 2;
        const totalSideLoss = splitCount * sideLoss;
        const finalWCut = wFinished + totalSideLoss;
        const hCut = hFinished + currentHeaderLoss + bottomLoss;

        let quantity = 0;
        let alternatives: AlternativeSolution[] | undefined;
        let heightOverflow = false;

        // 3. 算法分支
        if (formula === 'FIXED_HEIGHT') {
            // 定高面料: 买宽
            const maxEffectiveHeight = fabricWidth - currentHeaderLoss - bottomLoss;

            if (hFinished > maxEffectiveHeight) {
                heightOverflow = true;

                // 生成替代方案
                alternatives = this.generateAlternatives({
                    hFinished,
                    wFinished,
                    fabricWidth,
                    sideLoss,
                    splitCount,
                    headerLossWrapped,
                    headerLossAttached,
                    bottomLoss,
                    unitPrice,
                });

                if (hFinished <= maxEffectiveHeight + (headerLossWrapped - headerLossAttached)) {
                    warnings.push('高度超限，建议使用贴布带工艺');
                } else {
                    warnings.push('超高预警：需选择替代方案（贴布带/小底边/拼接）');
                }
            }

            quantity = finalWCut / 100;

        } else if (formula === 'FIXED_WIDTH') {
            // 定宽面料: 买高
            const numWidths = Math.ceil(finalWCut / fabricWidth);
            quantity = (numWidths * hCut) / 100;
        }

        return {
            quantity: Number(quantity.toFixed(2)),
            warnings,
            details: {
                hFinished,
                wFinished,
                wCut: finalWCut,
                hCut,
                formula,
                headerType,
            },
            alternatives,
            heightOverflow,
        };
    },

    /**
     * 生成超高替代方案
     */
    generateAlternatives(opts: {
        hFinished: number;
        wFinished: number;
        fabricWidth: number;
        sideLoss: number;
        splitCount: number;
        headerLossWrapped: number;
        headerLossAttached: number;
        bottomLoss: number;
        unitPrice: number;
    }): AlternativeSolution[] {
        const {
            hFinished,
            wFinished,
            fabricWidth,
            sideLoss,
            splitCount,
            headerLossWrapped,
            headerLossAttached,
            bottomLoss,
            unitPrice,
        } = opts;

        const totalSideLoss = splitCount * sideLoss;
        const solutions: AlternativeSolution[] = [];
        const SMALL_BOTTOM = 5; // 小底边

        // 方案1：改用贴布带
        const _hCut1 = hFinished + headerLossAttached + bottomLoss;
        const maxH1 = fabricWidth - headerLossAttached - bottomLoss;
        if (hFinished <= maxH1) {
            const qty1 = (wFinished + totalSideLoss) / 100;
            solutions.push({
                name: '改用贴布带',
                description: `帘头改为贴布带 (${headerLossAttached}cm)，保留标准底边`,
                headerType: 'ATTACHED',
                headerLoss: headerLossAttached,
                bottomLoss: bottomLoss,
                quantity: Number(qty1.toFixed(2)),
                priceDiff: 0,
                recommended: true,
            });
        }

        // 方案2：小底边
        const _hCut2 = hFinished + headerLossWrapped + SMALL_BOTTOM;
        const maxH2 = fabricWidth - headerLossWrapped - SMALL_BOTTOM;
        if (hFinished <= maxH2) {
            const qty2 = (wFinished + totalSideLoss) / 100;
            solutions.push({
                name: '减小底边',
                description: `保留包布带，底边减至 ${SMALL_BOTTOM}cm`,
                headerType: 'WRAPPED',
                headerLoss: headerLossWrapped,
                bottomLoss: SMALL_BOTTOM,
                quantity: Number(qty2.toFixed(2)),
                priceDiff: 0,
            });
        }

        // 方案3：拼接
        const _hCut3 = hFinished + headerLossWrapped + bottomLoss;
        const qty3 = ((wFinished + totalSideLoss) / 100) * 2; // 双倍用料
        solutions.push({
            name: '接布拼接',
            description: '需要拼接工艺，用料翻倍',
            headerType: 'WRAPPED',
            headerLoss: headerLossWrapped,
            bottomLoss: bottomLoss,
            quantity: Number(qty3.toFixed(2)),
            priceDiff: Number((qty3 * unitPrice - (wFinished + totalSideLoss) / 100 * unitPrice).toFixed(2)),
        });

        return solutions;
    },
};

// ============ 墙纸/墙布计算器 ============

export const WallpaperCalculator = {
    calculate(params: WallpaperParams): CalculatorResult {
        const warnings: string[] = [];
        const {
            measuredWidth,
            measuredHeight,
            productWidth,
            rollLength,
            patternRepeat = 0,
            formula,
        } = params;

        const widthLoss = params.widthLoss ?? DEFAULTS.WIDTH_LOSS;
        let quantity = 0;

        if (formula === 'WALLPAPER') {
            if (!rollLength) throw new Error('Wallpaper requires rollLength');

            const cutLoss = params.cutLoss ?? DEFAULTS.CUT_LOSS;
            const widthWithLoss = measuredWidth + widthLoss;
            const nStrips = Math.ceil(widthWithLoss / productWidth);

            const hBase = measuredHeight + cutLoss;
            let hStrip = hBase;

            if (patternRepeat > 0) {
                const nLoops = Math.ceil(hBase / patternRepeat);
                hStrip = nLoops * patternRepeat;
            }

            const stripsPerRoll = Math.floor(rollLength / hStrip);

            if (stripsPerRoll === 0) {
                warnings.push('单卷长度不足以裁剪一幅');
                quantity = 0;
            } else {
                const nRolls = Math.ceil(nStrips / stripsPerRoll);
                quantity = nRolls;
            }

        } else if (formula === 'WALLCLOTH') {
            const widthWithLoss = measuredWidth + widthLoss;

            if (measuredHeight > productWidth) {
                warnings.push('墙高超过墙布幅宽，需拼接');
            }

            const qWidthM = widthWithLoss / 100;
            const qHeightM = productWidth / 100;
            quantity = qWidthM * qHeightM;
        }

        return {
            quantity: Number(quantity.toFixed(2)),
            warnings,
            details: { formula },
        };
    },
};
