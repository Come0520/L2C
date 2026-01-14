export interface CalculatorResult {
    quantity: number;
    warnings: string[];
    details: any; // Debug info or detailed breakdown
}

export type CurtainFormula = 'FIXED_HEIGHT' | 'FIXED_WIDTH';
export type WallpaperFormula = 'WALLPAPER' | 'WALLCLOTH';

export interface CurtainParams {
    measuredWidth: number;   // 测量宽度 (cm)
    measuredHeight: number;  // 测量高度 (cm)
    foldRatio: number;       // 褶皱倍数 (1.5-3.5)
    fabricWidth: number;     // 面料幅宽 (cm)
    formula: CurtainFormula; // 定高/定宽

    // Configurable Loss
    sideLoss?: number;       // 单边损耗 (default: 5cm)
    bottomLoss?: number;     //底边损耗 (default: 10cm)
    headerLoss?: number;     // 帘头损耗 (default: 20cm for WRAPPED)

    // Advanced
    splitType?: 'SINGLE' | 'DOUBLE' | 'MULTI'; // 单开/对开/多开
}

export interface WallpaperParams {
    measuredWidth: number;   // 测量宽度 (cm)
    measuredHeight: number;  // 测量高度 (cm)

    productWidth: number;    // 商品幅宽 (cm) - 墙纸定宽，墙布定高
    rollLength?: number;     // 卷长 (cm) - 仅墙纸
    patternRepeat?: number;  // 花距 (cm) - 仅墙纸

    formula: WallpaperFormula;

    // Loss
    widthLoss?: number;      // 宽度损耗 (default: 20cm)
    cutLoss?: number;        // 裁剪损耗 (default: 10cm)
}

const CONSTANTS = {
    DEFAULT_SIDE_LOSS: 5,
    DEFAULT_BOTTOM_LOSS: 10,
    DEFAULT_HEADER_LOSS: 20, // Wrapped
    DEFAULT_WIDTH_LOSS: 20,
    DEFAULT_CUT_LOSS: 10,
    HEIGHT_WARNING_THRESHOLD: 275,
};

export const CurtainCalculator = {
    calculate: (params: CurtainParams): CalculatorResult => {
        const warnings: string[] = [];
        const {
            measuredWidth,
            measuredHeight,
            foldRatio,
            fabricWidth,
            formula,
            splitType = 'DOUBLE',
        } = params;

        const sideLoss = params.sideLoss ?? CONSTANTS.DEFAULT_SIDE_LOSS;
        const headerLoss = params.headerLoss ?? CONSTANTS.DEFAULT_HEADER_LOSS;
        const bottomLoss = params.bottomLoss ?? CONSTANTS.DEFAULT_BOTTOM_LOSS;

        // 1. 成品尺寸
        // H_finished = H_measured - CLR (Assuming CLR is handled outside or passed as net height? 
        // Docs say H_finished = H_meas - CLR. Let's assume input measuredHeight is already net or we need CLR param.
        // Simplified: Assume input IS the height to cover for now, or add CLR param.
        // Let's stick to input height as "Height used for calculation".
        const hFinished = measuredHeight;
        const wFinished = measuredWidth * foldRatio;

        // 2. 裁剪尺寸
        // Width Cut
        const splitCount = splitType === 'SINGLE' ? 1 : (splitType === 'DOUBLE' ? 2 : 2); // Multi simplified as 2 for now logic
        const wCut = wFinished + (splitCount * sideLoss * 2); // Each piece has 2 sides? 
        // Docs: "Double(2 pieces) add 10cm; Single(1 piece) add 5cm". 
        // If Side Loss is 5cm/side.
        // Single: 1 piece * 2 sides * 5cm = 10cm? Or docs mean total side loss?
        // Docs: "SIDE_LOSS: 5cm/side". "Example: Double add 10cm; Single add 5cm".
        // This implies Single adds 1x5cm? Or does it mean "Total addition"?
        // Usually Single curtain has 2 sides (left/right). Double has 4 sides total.
        // Let's interpret Docs: "Double (2 pieces) add 10cm" -> maybe means 5cm * 2pcs? or 2.5cm * 4 sides?
        // Let's follow "SIDE_LOSS: 5cm/side". 
        // Logic: Total Side Loss = Pieces * 2 sides * SideLoss?
        // If 2 pieces, 4 sides. 4 * 5 = 20cm.
        // Docs example "Double add 10cm" contradicts "5cm/side" unless "5cm/side" is "5cm per piece"? 
        // Or "5cm total per piece"?
        // Let's trust the Example: Double -> 10cm, Single -> 5cm.
        // This suggests: Loss = Pieces * 5cm.
        const totalSideLoss = splitCount * sideLoss; // Matches example if sideLoss=5

        const finalWCut = wFinished + totalSideLoss;

        // Height Cut
        const hCut = hFinished + headerLoss + bottomLoss;

        let quantity = 0;

        // 3. 算法分支
        if (formula === 'FIXED_HEIGHT') {
            // 定高面料: 买宽
            // Check High Warning
            // Max effective height = FabricWidth - HeaderLoss - BottomLoss
            const maxEffectiveHeight = fabricWidth - headerLoss - bottomLoss;
            if (hFinished > maxEffectiveHeight) {
                if (hFinished <= maxEffectiveHeight + 13) {
                    warnings.push('建议让渡帘头 (改为贴布带)');
                } else {
                    warnings.push('超高预警: 需要拼接或特殊工艺');
                }
            }

            // Q = W_cut / 100 (cm -> m)
            quantity = finalWCut / 100;

        } else if (formula === 'FIXED_WIDTH') {
            // 定宽面料: 买高
            // Widths needed = ceil(W_cut / fabricWidth)
            const numWidths = Math.ceil(finalWCut / fabricWidth);

            // Q = N * H_cut / 100
            quantity = (numWidths * hCut) / 100;
        }

        return {
            quantity: Number(quantity.toFixed(2)), // Round to 2 decimal
            warnings,
            details: {
                hFinished,
                wFinished,
                wCut: finalWCut,
                hCut,
                formula
            }
        };
    }
};

export const WallpaperCalculator = {
    calculate: (params: WallpaperParams): CalculatorResult => {
        const warnings: string[] = [];
        const {
            measuredWidth,
            measuredHeight,
            productWidth,
            rollLength,
            patternRepeat = 0,
            formula
        } = params;

        const widthLoss = params.widthLoss ?? CONSTANTS.DEFAULT_WIDTH_LOSS;

        let quantity = 0;

        if (formula === 'WALLPAPER') {
            // 墙纸: 计卷
            if (!rollLength) throw new Error('Wallpaper requires rollLength');

            const cutLoss = params.cutLoss ?? CONSTANTS.DEFAULT_CUT_LOSS;

            // 1. Strips
            const widthWithLoss = measuredWidth + widthLoss;
            const nStrips = Math.ceil(widthWithLoss / productWidth);

            // 2. Per Roll
            // H_base = H_meas + H_loss
            // H_loss = cutLoss 
            // Note: Docs says "Width Loss default 20cm", "Cut Loss default 10cm/strip"

            const hBase = measuredHeight + cutLoss;
            let hStrip = hBase;

            if (patternRepeat > 0) {
                const nLoops = Math.ceil(hBase / patternRepeat);
                hStrip = nLoops * patternRepeat;
            }

            const stripsPerRoll = Math.floor(rollLength / hStrip);

            if (stripsPerRoll === 0) {
                warnings.push('单卷长度不足以裁剪一幅');
                // Fallback logic could be handled, but strictly return 0 or infinity?
                quantity = 0;
            } else {
                const nRolls = Math.ceil(nStrips / stripsPerRoll);
                quantity = nRolls;
            }

        } else if (formula === 'WALLCLOTH') {
            // 墙布: 计平米 (但实际可能是算延长米 * 定高? Docs say "Qty = Area")
            // Docs 6.1.2: "Qty field auto fills with Area"
            // Docs 6.1.2 Formula: Total = (WallWidth * FabricWidth) * UnitPrice
            // Wait, usually Wallcloth is sold by "Length" if it is "Fixed Height".
            // Docs Sec 6.1.2 says: "Basic Prop: Unit m2". "Default Spec: Fixed Height 2.8m".
            // "Calc Logic: If WallHeight < FabricWidth, seamless."
            // "Calc Area: WallWidth * FabricWidth = Consumed Area".
            // "Special Note: Although sold by m2, actual cutting is by linear meter. System ensure Quantity field fills this Area."
            // So Quantity = WallWidth * FabricWidth? 
            // Yes, because Price is per m2. 
            // If Price was per Linear Meter, Qty would be WallWidth.
            // But here Qty is Area.

            // Width Loss logic
            const widthWithLoss = measuredWidth + widthLoss;

            // If H > FabricWidth ??
            if (measuredHeight > productWidth) {
                warnings.push('墙高超过墙布幅宽，需拼接');
            }

            // Area = Width(m) * Height(m) ?? 
            // Docs: "WallWidth(m) * FabricWidth(fixed height)"
            // So it calculates the area of the bounding box defined by [WallWidth+Loss] x [FabricFixedHeight]

            const qWidthM = widthWithLoss / 100;
            const qHeightM = productWidth / 100; // Fixed Height is used as height factor

            quantity = qWidthM * qHeightM;
        }

        return {
            quantity: Number(quantity.toFixed(2)),
            warnings,
            details: {
                formula
            }
        };
    }
};
