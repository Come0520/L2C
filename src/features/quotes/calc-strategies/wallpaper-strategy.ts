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

        let totalWidth = 0;
        let warning: string | undefined;

        if (wallSegments.length > 0) {
            totalWidth = wallSegments.reduce((sum, segment) => sum + segment.width + widthLoss, 0);
        } else {
            totalWidth = width + widthLoss;
        }

        const totalWidthM = totalWidth / 100;
        const usageHeight = fabricWidth + (heightLoss / 100);

        if (height > fabricWidth * 100) {
            warning = `墙高 ${height}cm exceeds 面料幅宽 ${fabricWidth * 100}cm`;
        }

        const usage = totalWidthM * usageHeight;
        const subtotal = usage * unitPrice;

        return {
            usage,
            subtotal,
            details: {
                warning
            }
        };
    }
}