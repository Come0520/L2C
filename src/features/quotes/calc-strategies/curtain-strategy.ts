import { BaseCalcStrategy, type CalcParams } from './base-strategy';

export interface CurtainCalcParams extends CalcParams {
    measuredWidth: number;   // 测量宽度 (cm)
    measuredHeight: number;  // 测量高度 (cm)
    foldRatio?: number;      // 褶皱倍数 (默认 2.0)
    clearance?: number;      // 离地高度 (cm)

    // 面料属性
    fabricWidth: number;     // 面料幅宽 (m) -> 需转 cm
    fabricType: 'FIXED_HEIGHT' | 'FIXED_WIDTH'; // 定高 | 定宽
    unitPrice: number;

    // 损耗配置 (cm)
    sideLoss?: number;       // 侧边损耗 (默认 20/10)
    headerLoss?: number;     // 帘头损耗
    bottomLoss?: number;     // 底边损耗

    // 工艺选项
    headerType?: 'WRAPPED' | 'ATTACHED'; // 包布带 | 贴布带
    openingType?: 'SINGLE' | 'DOUBLE';   // 单开 | 双开
}

export interface CurtainCalcResult {
    usage: number;           // 用量 (米)
    subtotal: number;        // 小计
    details: {
        finishedWidth: number;
        finishedHeight: number;
        cutWidth: number;
        cutHeight: number;
        fabricWidthCm: number;
        stripCount?: number; // 定宽模式下的幅数
        warning?: string;    // 预警信息 (如超高)
    };
}

export class CurtainStrategy extends BaseCalcStrategy<CurtainCalcParams, CurtainCalcResult> {
    private readonly DEFAULTS = {
        SIDE_LOSS: 10,       // 默认每片主要边总损耗 (实际上逻辑是每边5cm, total=10 for 1 piece side-by-side?) 
        // 文档: "双开(2片)增加 10cm; 单开(1片)增加 5cm" => 每片增加 5cm? 
        // 文档 3.1: "W_cut = W_finished + (2 * SIDE_LOSS)" where SIDE_LOSS=5cm. 
        // So if DOUBLE opening, do we calc total width once?
        // 逻辑 check: Usually we calc Total Finished Width, then Total Cut Width.
        // Eq: W_finished = W_measured * F.
        // W_cut = W_finished + (2 * SIDE_LOSS). 
        // Wait, if Double Opening, we have 4 side edges (Left-Outer, Left-Inner, Right-Inner, Right-Outer).
        // Doc Example: "双开(2片)增加 10cm; 单开(1片)增加 5cm".
        // This implies Total Loss = openingCount * (2 * per_edge_loss).
        // But doc formula says `+ (2 * SIDE_LOSS)`. 
        // Let's assume SIDE_LOSS is "Total Side Loss for the whole window" based on Opening Type in the implementation.

        HEADER_LOSS_WRAPPED: 20,
        HEADER_LOSS_ATTACHED: 7,
        BOTTOM_LOSS: 10,
        MAX_HEIGHT_THRESHOLD: 275
    };

    calculate(params: CurtainCalcParams): CurtainCalcResult {
        const {
            measuredWidth,
            measuredHeight,
            foldRatio = 2.0,
            clearance = 0,
            fabricWidth,
            fabricType,
            unitPrice,
            headerType = 'WRAPPED',
            openingType = 'DOUBLE'
        } = params;

        // 1. Determine Losses
        // Doc: SIDE_LOSS is 5cm per edge? 
        // Doc says: "双开(2片)增加 10cm". 
        // So for Double: Loss = 10. For Single: Loss = 5.
        // Let's use dynamic calculation.
        const sideLossTotal = params.sideLoss ?? (openingType === 'DOUBLE' ? 10 : 5);

        const headerLoss = params.headerLoss ??
            (headerType === 'WRAPPED' ? this.DEFAULTS.HEADER_LOSS_WRAPPED : this.DEFAULTS.HEADER_LOSS_ATTACHED);

        const bottomLoss = params.bottomLoss ?? this.DEFAULTS.BOTTOM_LOSS;

        // 2. Finished Size
        const finishedWidth = measuredWidth * foldRatio;
        const finishedHeight = measuredHeight - clearance;

        // 3. Cut Size
        const cutWidth = finishedWidth + sideLossTotal;
        const cutHeight = finishedHeight + headerLoss + bottomLoss;

        const fabricWidthCm = fabricWidth * 100; // Convert m to cm

        let usage = 0;
        const details: CurtainCalcResult['details'] = {
            finishedWidth,
            finishedHeight,
            cutWidth,
            cutHeight,
            fabricWidthCm
        };

        // 4. Algorithm Branch
        if (fabricType === 'FIXED_HEIGHT') {
            // 定高: Check Height Constraint
            // Max Effective Height = FabricWidth - Loss (This is implicit, usually we compare cutHeight vs FabricWidth)
            // Actually doc says: H_max = 面料总幅宽 - HEADER - BOTTOM.
            // Then checks if H_finished <= H_max.
            // This is equivalent to H_finished + HEADER + BOTTOM <= FabricWidth.
            // i.e., cutHeight <= FabricWidth.

            if (cutHeight > fabricWidthCm) {
                // Check warning thresholds
                const diff = cutHeight - fabricWidthCm;
                if (diff <= 13) {
                    details.warning = "建议让渡帘头：改用贴布带工艺";
                } else {
                    details.warning = "超高预警：需让渡底边或拼接";
                }
            }

            // Usage = Cut Width (cm) converted to m
            // Doc: Q = W_cut. Unit: m.
            usage = cutWidth / 100;

        } else {
            // 定宽: Fixed Width (e.g. 140cm or 280cm used as width limit)
            // N = ceil(W_cut / FabricWidth)
            const stripCount = Math.ceil(cutWidth / fabricWidthCm);
            usage = (stripCount * cutHeight) / 100; // Total height needed in m
            details.stripCount = stripCount;
        }

        // Rounding: Doc says "Reserve 1 decimal place" (保留小数点后 1 位). 
        // In JS, `toFixed(1)` returns string. We'll use Math.round or similar business logic.
        // Let's standard usage to 2 decimals for safe currency calc, but doc says 1.
        // "结果保留小数点后 1 位".
        // Also "Fixed Width Q = N * H_cut ... 结果向上进位?" -> "保留... 向上进位" implies Ceil to 0.1?
        // Let's implement generous rounding: Math.ceil(usage * 10) / 10.

        const finalizedUsage = Math.ceil(usage * 10) / 10;

        return {
            usage: finalizedUsage,
            subtotal: finalizedUsage * unitPrice,
            details
        };
    }
}
