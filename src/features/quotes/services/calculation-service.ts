/**
 * Quote Calculation Service
 * Core logic associated with Quote logic
 */
import { db } from '@/shared/api/db';
import { quoteItems } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { CurtainStrategy } from '../calc-strategies/curtain-strategy';
import { WallpaperStrategy } from '../calc-strategies/wallpaper-strategy';
import { StandardProductStrategy } from '../calc-strategies/standard-product-strategy';
import type { QuoteItemAttributes } from '@/shared/api/types/quote-types';



import { products } from '@/shared/api/schema/catalogs';

type QuoteItemWithProduct = typeof quoteItems.$inferSelect & {
    product: typeof products.$inferSelect | null;
};

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

        // Extract attributes safely
        const attrs = (item.attributes || {}) as QuoteItemAttributes;

        if (category === 'CURTAIN' || category.startsWith('CURTAIN_')) {
            // Use CurtainStrategy
            const strategy = new CurtainStrategy();

            // Map parameters
            // DB stores fabricWidth in CM (likely), Strategy expects M? No, wait.
            // Let's re-verify Strategy implementation from file viewing.
            // Strategy: `const fabricWidthCm = fabricWidth * 100`. So Strategy expects Meters.
            // Attributes: `fabricWidth` is usually CM (e.g. 280).
            // So pass `fabricWidth / 100`.

            const specs = item.product?.specs as Record<string, unknown> | null;
            const fabricWidthCm = Number(attrs.fabricWidth || specs?.['fabricWidth'] || 0);

            // Enum mapping
            const headerType = (attrs.headerProcessType || 'WRAPPED') as 'WRAPPED' | 'ATTACHED';
            const openingType = (attrs.openingStyle || 'DOUBLE') as 'SINGLE' | 'DOUBLE';
            const fabricType = (attrs.fabricDirection === 'WIDTH' ? 'FIXED_WIDTH' : 'FIXED_HEIGHT');
            // Note: Old 'fabricDirection' HEIGHT -> FIXED_HEIGHT (定高), WIDTH -> FIXED_WIDTH (定宽)

            const result = strategy.calculate({
                measuredWidth: width,
                measuredHeight: height,
                foldRatio: Number(item.foldRatio || 2.0),
                clearance: Number(item.attributes?.groundClearance || 0),
                fabricWidth: fabricWidthCm / 100, // Convert CM to M
                fabricType,
                unitPrice: Number(item.unitPrice || 0),
                headerType,
                openingType,
                // Optional overrides from attributes if they exist
                sideLoss: attrs.sideLoss ? Number(attrs.sideLoss) : undefined,
                headerLoss: attrs.headerLoss ? Number(attrs.headerLoss) : undefined,
                bottomLoss: attrs.bottomLoss ? Number(attrs.bottomLoss) : undefined
            });

            return {
                usage: result.usage,
                subtotal: result.subtotal,
                finishedWidth: result.details.finishedWidth,
                finishedHeight: result.details.finishedHeight,
                cutWidth: result.details.cutWidth,
                cutHeight: result.details.cutHeight,
                panelCount: result.details.stripCount, // For fixed width
                warnings: result.details.warning ? [{ type: 'WARNING', message: result.details.warning }] : []
            };

        } else if (category === 'WALLPAPER' || category === 'WALLCLOTH') {
            return this.calculateWallpaper(item, width, height, attrs);
        } else {
            return this.calculateStandard(item, width, height);
        }
    }

    private calculateWallpaper(item: QuoteItemWithProduct, width: number, height: number, attrs: QuoteItemAttributes) {
        const strategy = new WallpaperStrategy();
        const calcType = item.category === 'WALLCLOTH' ? 'WALLCLOTH' : 'WALLPAPER';

        // Fabric width from attributes or product (CM)
        const specs = item.product?.specs as Record<string, unknown> | null;
        const fabricWidthCm = Number(attrs.fabricWidth || specs?.['fabricWidth'] || 0);

        const result = strategy.calculate({
            width,
            height,
            fabricWidth: fabricWidthCm / 100, // Strategy expects Meters? 
            // WallpaperStrategy: `totalStrips = ... / (fabricWidth * 100)`. Yes, expects Meters.
            unitPrice: Number(item.unitPrice || 0),
            calcType,
            // Pass other params from attrs if needed
            rollLength: attrs.rollLength ? Number(attrs.rollLength) : undefined
        });

        return {
            usage: result.usage,
            subtotal: result.subtotal,
            details: result.details
        };
    }


    private calculateStandard(item: QuoteItemWithProduct, _width: number, _height: number) {
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
