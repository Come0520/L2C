'use client';

import { StrategyFactory } from '@/features/quotes/calc-strategies/strategy-factory';

import type { CalcParams } from '@/features/quotes/calc-strategies/base-strategy';
import type { QuoteItem, CalcResult } from './types';

type CalcResultType = { quantity: number; calcResult?: CalcResult } | number | null;

interface UnifiedCalcParams extends CalcParams {
  fabricType?: string;
  headerType?: string;
  openingType?: string;
  sideLoss?: number;
  bottomLoss?: number;
  widthLoss?: number;
  cutLoss?: number;
  rollLength?: number;
  calcType?: string;
  [key: string]: unknown;
}

export function useClientCalc() {
  const calculate = (item: QuoteItem, field: string, value: number): CalcResultType => {
    // ... (lines 10-48 remain same logic, just ensure no any types used) 
    // I need to provide the full content for the replaced block to be safe or use small chunks. 
    // The target here is to replace the calcParams declaration and the imports.
    // Let's replace the whole file content helper or just the relevant parts.
    // I'll replace from imports down to calcParams definition.

    // Actually, I can replace the imports first, then the function body part.
    // Let's try to do it in one go if possible, but the file is small so maybe okay.
    // Wait, the instruction says "EndLine: 74".
    // I'll construct the replacement for the whole file or a large chunk.

    // Let's replace the imports and the interface definition and the calcParams variable type.

    // Imports
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

    let strategyCategory = '';
    if (['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(upperCategory) || upperCategory.includes('CURTAIN')) {
      strategyCategory = 'CURTAIN';
    } else if (['WALLPAPER'].includes(upperCategory)) {
      strategyCategory = 'WALLPAPER';
    } else if (['WALLCLOTH'].includes(upperCategory)) {
      strategyCategory = 'WALLCLOTH';
    }

    if (strategyCategory) {
      const attributes = (newItem.attributes || {}) as Record<string, unknown>;
      const strategy = StrategyFactory.getStrategy(strategyCategory);

      // Construct calcParams based on category
      // Unified params as StrategyFactory expects generic params, but we know the specific keys needed

      const fabricWidthCm = Number(attributes.fabricWidth) || (strategyCategory === 'CURTAIN' ? 280 : 53);

      const calcParams: UnifiedCalcParams = {
        measuredWidth: width,
        measuredHeight: height,
        unitPrice: unitPrice,
        fabricWidth: fabricWidthCm / 100, // Convert cm to m as practiced in quote-item-crud.ts

        // Curtain specific
        foldRatio: Number(newItem.foldRatio) || 2,
        fabricType: (attributes.fabricType as string) || 'FIXED_HEIGHT',
        headerType: (attributes.headerType as string) || 'WRAPPED',
        openingType: (attributes.openingType as string) || 'DOUBLE',
        sideLoss: attributes.sideLoss !== undefined ? Number(attributes.sideLoss) : undefined,
        bottomLoss: attributes.bottomLoss !== undefined ? Number(attributes.bottomLoss) : 10,

        // Wallpaper specific
        rollLength: Number(attributes.rollLength) || 10, // Default 10m
        patternRepeat: Number(attributes.patternRepeat) || 0,
        widthLoss: attributes.widthLoss !== undefined ? Number(attributes.widthLoss) : undefined,
        cutLoss: attributes.cutLoss !== undefined ? Number(attributes.cutLoss) : undefined,

        calcType: strategyCategory
      };

      const result = strategy.calculate(calcParams);

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
    }
    return null;
  };

  return { calculate };
}
