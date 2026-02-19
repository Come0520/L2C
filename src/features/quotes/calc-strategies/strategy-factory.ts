import { StandardProductStrategy } from './standard-product-strategy';
import { WallpaperStrategy } from './wallpaper-strategy';
import { CurtainStrategy } from './curtain-strategy';
import type { BaseCalcStrategy, CalcParams, CalcResult } from './base-strategy';

export class StrategyFactory {
    static getStrategy(category: string): BaseCalcStrategy<CalcParams, CalcResult> {
        switch (category) {
            case 'WALLPAPER':
            case 'WALLCLOTH':
                return new WallpaperStrategy();
            case 'CURTAIN':
            case 'CURTAIN_FABRIC':
                return new CurtainStrategy();
            default:
                return new StandardProductStrategy();
        }
    }
}
