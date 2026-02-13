/**
 * Quote Calculation Service
 * Core logic associated with Quote logic
 */
import { db } from '@/shared/api/db';
import { quoteItems } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { CurtainQuantityEngine, CurtainCalcInput } from '../logic/curtain-calc-engine';
import { WallpaperStrategy } from '../calc-strategies/wallpaper-strategy';
import { StandardProductStrategy } from '../calc-strategies/standard-product-strategy';

// 强类型联合，与 CurtainCalcInput 保持一致
type HeaderProcessType = 'WRAPPED' | 'ATTACHED' | 'NONE';
type FabricDirection = 'HEIGHT' | 'WIDTH';
type OpeningStyle = 'SINGLE' | 'DOUBLE';
type WallCalcType = 'WALLPAPER' | 'WALLCLOTH';

interface CalcItem {
    foldRatio?: string | number;
    groundClearance?: string | number;
    headerProcessType?: string;
    fabricDirection?: string;
    fabricWidth?: string | number;
    fabricSize?: string | number;
    openingStyle?: string;
    unitPrice?: string | number;
    category?: string;
    quantity?: string | number;
}

class QuoteCalculationServiceClass {
    async recalculateItem(itemId: string, overrides: { width?: number; height?: number }) {
        const item = await db.query.quoteItems.findFirst({
            where: eq(quoteItems.id, itemId),
            with: {
                product: true
            }
        });

        if (!item) throw new Error('Quote item not found');

        const category = item.category as string;
        const width = overrides.width ?? Number(item.width);
        const height = overrides.height ?? Number(item.height);

        if (category === 'CURTAIN' || category.startsWith('CURTAIN_')) {

            return this.calculateCurtain(item as unknown as CalcItem, width, height);
        } else if (category === 'WALLPAPER' || category === 'WALLCLOTH') {

            return this.calculateWallpaper(item as unknown as CalcItem, width, height);
        } else {

            return this.calculateStandard(item as unknown as CalcItem, width, height);
        }
    }

    private calculateCurtain(item: CalcItem, width: number, height: number) {
        const engine = new CurtainQuantityEngine();

        // 类型安全的默认值转换
        const validHeaderTypes: HeaderProcessType[] = ['WRAPPED', 'ATTACHED', 'NONE'];
        const headerProcessType: HeaderProcessType = validHeaderTypes.includes(item.headerProcessType as HeaderProcessType)
            ? (item.headerProcessType as HeaderProcessType)
            : 'NONE';

        const validFabricDirs: FabricDirection[] = ['HEIGHT', 'WIDTH'];
        const fabricDirection: FabricDirection = validFabricDirs.includes(item.fabricDirection as FabricDirection)
            ? (item.fabricDirection as FabricDirection)
            : 'HEIGHT';

        const validOpeningStyles: OpeningStyle[] = ['SINGLE', 'DOUBLE'];
        const openingStyle: OpeningStyle = validOpeningStyles.includes(item.openingStyle as OpeningStyle)
            ? (item.openingStyle as OpeningStyle)
            : 'DOUBLE';

        const input: CurtainCalcInput = {
            measuredWidth: width,
            measuredHeight: height,
            foldRatio: Number(item.foldRatio || 2.0),
            groundClearance: Number(item.groundClearance || 0),
            headerProcessType,
            fabricDirection,
            fabricSize: Number(item.fabricWidth || item.fabricSize || 0),
            openingStyle,
            unitPrice: Number(item.unitPrice || 0)
        };

        const result = engine.calculate(input);
        return {
            usage: result.quantity,
            subtotal: result.subtotal,
            finishedWidth: result.finishedWidth,
            finishedHeight: result.finishedHeight,
            cutWidth: result.cutWidth,
            cutHeight: result.cutHeight,
            panelCount: result.panelCount
        };
    }

    private calculateWallpaper(item: CalcItem, width: number, height: number) {
        const strategy = new WallpaperStrategy();

        // 类型安全的壁纸/墙布类型转换
        const validCalcTypes: WallCalcType[] = ['WALLPAPER', 'WALLCLOTH'];
        const calcType: WallCalcType = validCalcTypes.includes(item.category as WallCalcType)
            ? (item.category as WallCalcType)
            : 'WALLPAPER';

        const result = strategy.calculate({
            width,
            height,
            fabricWidth: Number(item.fabricWidth || 0),
            unitPrice: Number(item.unitPrice || 0),
            calcType,
            cutLoss: 10,
            widthLoss: 20,
            heightLoss: 10
        });

        return {
            usage: result.usage,
            subtotal: result.subtotal,
            details: result.details
        };
    }


    private calculateStandard(item: CalcItem, _width: number, _height: number) {
        const strategy = new StandardProductStrategy();
        const result = strategy.calculate({
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0)
        });

        return {
            usage: result.usage,
            subtotal: result.subtotal
        };
    }
}

export const QuoteCalculationService = new QuoteCalculationServiceClass();
