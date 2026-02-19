import { BaseCalcStrategy, type CalcParams } from './base-strategy';

export interface WallpaperCalcSettings {
    widthLoss: number;
    heightLoss: number;
    cutLoss: number;
    rollWidth: number;
    rollLength: number;
}

export const DEFAULT_WALLPAPER_CALC_SETTINGS: WallpaperCalcSettings = {
    widthLoss: 20,
    heightLoss: 10,
    cutLoss: 10,
    rollWidth: 0.53,
    rollLength: 10
};

export interface WallpaperCalcParams extends CalcParams {
    width?: number;
    height?: number;
    fabricWidth?: number;
    unitPrice?: number;
    calcType?: string;
    rollLength?: number;
    widthLoss?: number;
    cutLoss?: number;
    patternRepeat?: number;
    wallSegments?: Array<{ width: number }>;
    heightLoss?: number;
}

export interface WallpaperCalcResult {
    usage: number;
    subtotal: number;
    details?: {
        totalStrips?: number;
        effectiveHeightCm?: number;
        warning?: string;
        totalWidthM?: number;
        fabricWidthM?: number;
    };
}

export class WallpaperStrategy extends BaseCalcStrategy<WallpaperCalcParams, WallpaperCalcResult> {
    private settings: WallpaperCalcSettings;

    constructor(settings?: Partial<WallpaperCalcSettings>) {
        super();
        this.settings = {
            ...DEFAULT_WALLPAPER_CALC_SETTINGS,
            ...settings
        };
    }

    calculate(params: WallpaperCalcParams): WallpaperCalcResult {
        const {
            width = 0,
            height = 0,
            fabricWidth = 0,
            unitPrice = 0,
            calcType = 'WALLPAPER',
            rollLength = this.settings.rollLength,
            widthLoss = this.settings.widthLoss,
            cutLoss = this.settings.cutLoss,
            patternRepeat = 0,
            wallSegments = [],
            heightLoss = this.settings.heightLoss
        } = params;

        if (calcType === 'WALLPAPER') {
            return this.calculateWallpaper({
                width,
                height,
                fabricWidth,
                unitPrice,
                rollLength,
                widthLoss,
                cutLoss,
                patternRepeat,
                wallSegments
            });
        } else if (calcType === 'WALLCLOTH') {
            return this.calculateWallcloth({
                width,
                height,
                fabricWidth,
                unitPrice,
                widthLoss,
                heightLoss,
                wallSegments
            });
        }

        return { usage: 0, subtotal: 0 };
    }

    private calculateWallpaper(params: {
        width: number;
        height: number;
        fabricWidth: number;
        unitPrice: number;
        rollLength: number;
        widthLoss: number;
        cutLoss: number;
        patternRepeat: number;
        wallSegments: Array<{ width: number }>;
    }): WallpaperCalcResult {
        const { width, height, fabricWidth, unitPrice, rollLength, widthLoss, cutLoss, patternRepeat, wallSegments } = params;

        let totalStrips = 0;
        let effectiveHeightCm = height + cutLoss;

        if (patternRepeat > 0) {
            effectiveHeightCm = Math.ceil(effectiveHeightCm / patternRepeat) * patternRepeat;
        }

        if (wallSegments.length > 0) {
            totalStrips = wallSegments.reduce((sum, segment) => {
                return sum + Math.ceil((segment.width + widthLoss) / (fabricWidth * 100));
            }, 0);
        } else {
            totalStrips = Math.ceil((width + widthLoss) / (fabricWidth * 100));
        }

        const stripsPerRoll = Math.floor((rollLength * 100) / effectiveHeightCm);
        const rolls = Math.ceil(totalStrips / stripsPerRoll);

        return {
            usage: rolls,
            subtotal: rolls * unitPrice,
            details: {
                totalStrips,
                effectiveHeightCm
            }
        };
    }

    private calculateWallcloth(params: {
        width: number;
        height: number;
        fabricWidth: number;
        unitPrice: number;
        widthLoss: number;
        heightLoss: number;
        wallSegments: Array<{ width: number }>;
    }): WallpaperCalcResult {
        const { width, height, fabricWidth, unitPrice, widthLoss, heightLoss, wallSegments } = params;

        // P1-02 修复：墙布逻辑按面积（m²）计算，而非仅宽度
        // 需求文档 10.2：总价 = (墙面宽度 × 墙布幅宽) × 每平米单价

        let totalWidthCm = 0;
        let warning: string | undefined;

        if (wallSegments.length > 0) {
            totalWidthCm = wallSegments.reduce((sum, segment) => sum + segment.width + widthLoss, 0);
        } else {
            totalWidthCm = width + widthLoss;
        }

        const totalWidthM = totalWidthCm / 100;

        // 高度约束检查
        const cutHeightCm = height + heightLoss;
        const fabricWidthCm = fabricWidth * 100;

        if (cutHeightCm > fabricWidthCm) {
            warning = `墙布高度不足：需 ${cutHeightCm}cm (含损耗), 面料幅宽 ${fabricWidthCm}cm`;
        }

        // 面积 = 宽度（米） × 幅宽（米）
        // 墙布幅宽即为定高值，用于计算消耗面积
        const fabricWidthM = fabricWidth; // fabricWidth 传入时已是米
        const area = Math.ceil(totalWidthM * fabricWidthM * 100) / 100;
        const subtotal = Math.round(area * unitPrice * 100) / 100;

        return {
            usage: area,
            subtotal,
            details: {
                warning,
                effectiveHeightCm: cutHeightCm,
                totalWidthM,
                fabricWidthM,
            }
        };
    }
}