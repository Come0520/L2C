'use client';

import { StrategyFactory } from '@/features/quotes/calc-strategies/strategy-factory';

import type { CalcParams } from '@/features/quotes/calc-strategies/base-strategy';
import type { CalcResult } from './types';
import type { QuoteItem } from '@/shared/api/schema/quotes';

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
    const newItem = { ...item, [field]: value };
    const category = newItem.category || 'STANDARD';

    const width = Number(newItem.width);
    const height = Number(newItem.height);
    const unitPrice = Number(item.unitPrice);

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return null;
    }

    // 注意：unitPrice 不影响用量计算，仅用于小计金额
    // 不再因为 unitPrice 为 0 而阻止数量联动

    const upperCategory = category.toUpperCase();

    let strategyCategory = '';
    if (
      ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(upperCategory) ||
      upperCategory.includes('CURTAIN')
    ) {
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

      const fabricWidthCm =
        Number(attributes.fabricWidth) || (strategyCategory === 'CURTAIN' ? 280 : 53);

      const calcParams: UnifiedCalcParams = {
        measuredWidth: width * 100, // 转换 UI 上的米(m)为厘米(cm)以匹配 CurtainStrategy 定义
        measuredHeight: height * 100, // 转换 UI 上的米(m)为厘米(cm)
        unitPrice: unitPrice,
        fabricWidth: fabricWidthCm / 100, // Convert cm to m as practiced in quote-item-crud.ts

        // Curtain specific
        foldRatio: Number(newItem.foldRatio) || 2,
        fabricType: (attributes.fabricType as string) || 'FIXED_HEIGHT',
        headerType: (attributes.headerType as string) || 'WRAPPED',
        openingType: (attributes.openingStyle as string) || 'DOUBLE',
        sideLoss: attributes.sideLoss !== undefined ? Number(attributes.sideLoss) : undefined,
        bottomLoss: attributes.bottomLoss !== undefined ? Number(attributes.bottomLoss) : 10,
        customPanels: Array.isArray(attributes.customPanels)
          ? (attributes.customPanels as { width: number }[])
          : undefined,

        // Wallpaper specific
        rollLength: Number(attributes.rollLength) || 10, // Default 10m
        patternRepeat: Number(attributes.patternRepeat) || 0,
        widthLoss: attributes.widthLoss !== undefined ? Number(attributes.widthLoss) : undefined,
        cutLoss: attributes.cutLoss !== undefined ? Number(attributes.cutLoss) : undefined,

        calcType: strategyCategory,
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
