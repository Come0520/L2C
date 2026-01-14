import { StandardProductStrategy } from './standard-product-strategy';
import { WallpaperStrategy } from './wallpaper-strategy';

export class StrategyFactory {
    static getStrategy(type: string) {
        if (type === 'WALLPAPER') {
            return new WallpaperStrategy();
        }
        return new StandardProductStrategy();
    }
}
