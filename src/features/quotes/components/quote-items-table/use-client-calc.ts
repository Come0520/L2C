'use client';

import {
  CurtainStrategy,
  type CurtainCalcParams,
} from '@/features/quotes/calc-strategies/curtain-strategy';
import { WallpaperCalculator } from '@/features/quotes/logic/calculator';
import type { QuoteItem, CalcResult } from './types';

type CalcResultType = { quantity: number; calcResult?: CalcResult } | number | null;

export function useClientCalc() {
  const calculate = (item: QuoteItem, field: string, value: number): CalcResultType => {
    const newItem = { ...item, [field]: value };
    const category = newItem.category;

    const width = Number(newItem.width);
    const height = Number(newItem.height);
    const unitPrice = Number(item.unitPrice);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return null;
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      return null;
    }

    const upperCategory = category.toUpperCase();
    const isCurtainCategory =
      ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(upperCategory) ||
      upperCategory.includes('CURTAIN');
    const isWallCategory = ['WALLPAPER', 'WALLCLOTH'].includes(upperCategory);

    if (isCurtainCategory || isWallCategory) {
      const attributes = (newItem.attributes || {}) as Record<string, unknown>;
      const strategy = new CurtainStrategy();

      if (isCurtainCategory) {
        const params: CurtainCalcParams = {
          measuredWidth: width,
          measuredHeight: height,
          foldRatio: Number(newItem.foldRatio) || 2,
          fabricWidth: Number(attributes.fabricWidth) || 280,
          fabricType: (attributes.fabricType as 'FIXED_HEIGHT' | 'FIXED_WIDTH') || 'FIXED_HEIGHT',
          unitPrice: unitPrice,
          openingType: (attributes.openingType as 'SINGLE' | 'DOUBLE') || 'DOUBLE',
          headerType: (attributes.headerType as 'WRAPPED' | 'ATTACHED') || 'WRAPPED',
          clearance: Number(attributes.clearance) || 0,
          sideLoss: attributes.sideLoss !== undefined ? Number(attributes.sideLoss) : undefined,
          bottomLoss: attributes.bottomLoss !== undefined ? Number(attributes.bottomLoss) : 10,
        };

        const result = strategy.calculate(params);

        if (result && typeof result.usage === 'number' && !isNaN(result.usage)) {
          return {
            quantity: result.usage,
            calcResult: {
              ...result.details,
              quantity: result.usage,
            },
          };
        }
        return null;
      } else if (isWallCategory) {
        const result = WallpaperCalculator.calculate({
          measuredWidth: width,
          measuredHeight: height,
          productWidth: Number(attributes.fabricWidth) || (category === 'WALLPAPER' ? 53 : 280),
          rollLength: Number(attributes.rollLength) || 1000,
          patternRepeat: Number(attributes.patternRepeat) || 0,
          formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as
            | 'WALLPAPER'
            | 'WALLCLOTH',
        });
        if (result && typeof result.quantity === 'number' && !isNaN(result.quantity)) {
          return result.quantity;
        }
        return null;
      }
      return null;
    }
    return null;
  };

  return { calculate };
}
