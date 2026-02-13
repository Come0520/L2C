import { BaseCalcStrategy } from './base-strategy';

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

export interface WallpaperCalcParams {
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
    };
}

export class WallpaperStrategy extends BaseCalcStrategy {
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

        // 墙布逻辑：通常是"定高"，按"周长"（宽度）购买
        // Usage = Total Width (m)

        let totalWidthCm = 0;
        let warning: string | undefined;

        if (wallSegments.length > 0) {
            totalWidthCm = wallSegments.reduce((sum, segment) => sum + segment.width + widthLoss, 0);
        } else {
            totalWidthCm = width + widthLoss;
        }

        const totalWidthM = totalWidthCm / 100;

        // Height Constraint Check
        // Cut Height = Room Height + Height Loss
        // Fabric Width (e.g. 2.8m) must >= Cut Height
        const cutHeightCm = height + heightLoss;
        const fabricWidthCm = fabricWidth * 100;

        if (cutHeightCm > fabricWidthCm) {
            // If exceeding, need splicing or rotation. Warning for now.
            warning = `墙布高度不足：需 ${cutHeightCm}cm (含损耗), 面料幅宽 ${fabricWidthCm}cm`;
        }

        // Usage is simply the length needed
        // Round up to 0.1m? Usually yes.
        const usage = Math.ceil(totalWidthM * 10) / 10;
        const subtotal = usage * unitPrice;

        return {
            usage,
            subtotal,
            details: {
                warning,
                effectiveHeightCm: cutHeightCm
            }
        };
    }
}