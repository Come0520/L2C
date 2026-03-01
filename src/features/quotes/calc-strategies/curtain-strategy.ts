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
    sideLoss?: number;       // 单边损耗 (cm)，每片窗帘一个侧边的损耗
    headerLoss?: number;     // 帘头损耗
    bottomLoss?: number;     // 底边损耗

    // 工艺选项
    headerType?: 'WRAPPED' | 'ATTACHED'; // 包布带 | 贴布带
    openingType?: 'SINGLE' | 'DOUBLE';   // 单开 | 双开

    // 自定义片数（优先级高于 openingType）
    // 每片指定窗户宽度 (cm)，系统自动 × 褶皱倍数 + 侧边损耗
    customPanels?: { width: number }[];
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
        stripCount?: number;   // 定宽模式下的幅数
        warning?: string;      // 预警信息 (如超高)
        panelDetails?: { width: number; cutWidth: number }[]; // 自定义片数明细
    };
}

export class CurtainStrategy extends BaseCalcStrategy<CurtainCalcParams, CurtainCalcResult> {
    private readonly DEFAULTS = {
        SIDE_LOSS_PER_EDGE: 5, // 单边损耗默认值 (cm)，即一片窗帘一个侧边的损耗
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

        // 单边损耗：一片窗帘一个侧边的损耗值
        const perEdgeLoss = params.sideLoss ?? this.DEFAULTS.SIDE_LOSS_PER_EDGE;
        // 每片侧边总损耗 = 单边损耗 × 2（每片有2个侧边）
        const perPanelSideLoss = perEdgeLoss * 2;

        const headerLoss = params.headerLoss ??
            (headerType === 'WRAPPED' ? this.DEFAULTS.HEADER_LOSS_WRAPPED : this.DEFAULTS.HEADER_LOSS_ATTACHED);

        const bottomLoss = params.bottomLoss ?? this.DEFAULTS.BOTTOM_LOSS;

        // 高度计算（所有片共用）
        const finishedHeight = measuredHeight - clearance;
        const cutHeight = finishedHeight + headerLoss + bottomLoss;
        const fabricWidthCm = fabricWidth * 100;

        // ─── 分支：自定义片数 vs 标准单开/双开 ───
        if (params.customPanels && params.customPanels.length > 0) {
            return this.calculateCustomPanels(params.customPanels, {
                foldRatio, perPanelSideLoss, cutHeight, fabricWidthCm,
                fabricType, unitPrice, finishedHeight, measuredWidth
            });
        }

        // ─── 标准模式：单开/双开 ───
        const panelCount = openingType === 'DOUBLE' ? 2 : 1;
        const sideLossTotal = perPanelSideLoss * panelCount;

        const finishedWidth = measuredWidth * foldRatio;
        const cutWidth = finishedWidth + sideLossTotal;

        let usage = 0;
        const details: CurtainCalcResult['details'] = {
            finishedWidth, finishedHeight, cutWidth, cutHeight, fabricWidthCm
        };

        if (fabricType === 'FIXED_HEIGHT') {
            // 定高模式：检查高度约束
            if (cutHeight > fabricWidthCm) {
                const diff = cutHeight - fabricWidthCm;
                if (diff <= 13) {
                    details.warning = "建议让渡帘头：改用贴布带工艺";
                } else {
                    details.warning = "超高预警：需让渡底边或拼接";
                }
            }
            usage = cutWidth / 100;
        } else {
            // 定宽模式：计算幅数
            const stripCount = Math.ceil(cutWidth / fabricWidthCm);
            usage = (stripCount * cutHeight) / 100;
            details.stripCount = stripCount;
        }

        const finalizedUsage = Math.ceil(usage * 10) / 10;
        return {
            usage: finalizedUsage,
            subtotal: finalizedUsage * unitPrice,
            details
        };
    }

    /**
     * 自定义片数计算模式
     * 每片宽度 × 褶皱倍数 + 2 × 单边损耗 = 每片裁切宽度
     * 总用量 = 所有片裁切宽度之和（定高）或分别计算幅数后累加（定宽）
     */
    private calculateCustomPanels(
        panels: { width: number }[],
        ctx: {
            foldRatio: number;
            perPanelSideLoss: number;
            cutHeight: number;
            fabricWidthCm: number;
            fabricType: string;
            unitPrice: number;
            finishedHeight: number;
            measuredWidth: number;
        }
    ): CurtainCalcResult {
        const panelDetails: { width: number; cutWidth: number }[] = [];
        let totalCutWidth = 0;
        let totalUsage = 0;
        let totalStripCount = 0;

        for (const panel of panels) {
            const panelCutWidth = panel.width * ctx.foldRatio + ctx.perPanelSideLoss;
            panelDetails.push({ width: panel.width, cutWidth: panelCutWidth });
            totalCutWidth += panelCutWidth;

            if (ctx.fabricType === 'FIXED_WIDTH') {
                // 定宽模式：每片分别计算幅数
                const strips = Math.ceil(panelCutWidth / ctx.fabricWidthCm);
                totalUsage += (strips * ctx.cutHeight) / 100;
                totalStripCount += strips;
            }
        }

        if (ctx.fabricType === 'FIXED_HEIGHT') {
            // 定高模式：总裁切宽度直接转米
            totalUsage = totalCutWidth / 100;
        }

        // 计算总成品宽度（用于 details）
        const totalFinishedWidth = panels.reduce((sum, p) => sum + p.width * ctx.foldRatio, 0);

        const details: CurtainCalcResult['details'] = {
            finishedWidth: totalFinishedWidth,
            finishedHeight: ctx.finishedHeight,
            cutWidth: totalCutWidth,
            cutHeight: ctx.cutHeight,
            fabricWidthCm: ctx.fabricWidthCm,
            panelDetails,
        };

        // 定高模式：检查高度约束
        if (ctx.fabricType === 'FIXED_HEIGHT' && ctx.cutHeight > ctx.fabricWidthCm) {
            const diff = ctx.cutHeight - ctx.fabricWidthCm;
            if (diff <= 13) {
                details.warning = "建议让渡帘头：改用贴布带工艺";
            } else {
                details.warning = "超高预警：需让渡底边或拼接";
            }
        }

        if (ctx.fabricType === 'FIXED_WIDTH') {
            details.stripCount = totalStripCount;
        }

        const finalizedUsage = Math.ceil(totalUsage * 10) / 10;
        return {
            usage: finalizedUsage,
            subtotal: finalizedUsage * ctx.unitPrice,
            details
        };
    }
}
