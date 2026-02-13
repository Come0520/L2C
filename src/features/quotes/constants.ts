import { z } from 'zod';
import { productCategoryEnum } from '@/shared/api/schema/enums';

// Use schema as source of truth
export const PRODUCT_CATEGORIES = productCategoryEnum.enumValues;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// Zod schema for validation
// @ts-expect-error - dizaale enumValues is strictly string[] but z.enum needs [string, ...string[]]
export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

export const CATEGORY_LABELS: Record<string, string> = {
  CURTAIN: '成品窗帘',
  CURTAIN_FABRIC: '窗帘面料',
  CURTAIN_SHEER: '窗纱',
  CURTAIN_TRACK: '窗帘轨道',
  CURTAIN_ACCESSORY: '窗帘辅料',
  BLIND: '功能帘',
  MOTOR: '电机',

  WALLPAPER: '墙纸',
  WALLCLOTH: '墙布',
  WALLCLOTH_ACCESSORY: '墙布辅料', // 兼容旧数据
  WALL_ACCESSORY: '墙面辅料',

  WALLPANEL: '墙咔',
  SOFT_PACK: '软/硬包',
  PANEL_ACCESSORY: '墙咔辅料',

  MATTRESS: '床垫',
  WINDOWPAD: '飘窗垫',
  STANDARD: '标品',

  SERVICE: '服务/费用',
  HARDWARE: '五金',
  OTHER: '其他',
};

export interface CategoryGroup {
  label: string;
  value: string;
  categories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    label: '窗饰系统',
    value: 'WINDOW',
    categories: [
      'CURTAIN_FABRIC',
      'CURTAIN_SHEER',
      'CURTAIN',
      'BLIND',
      'CURTAIN_TRACK',
      'MOTOR',
      'CURTAIN_ACCESSORY',
    ],
  },
  {
    label: '墙面系统',
    value: 'WALL',
    categories: ['WALLPAPER', 'WALLCLOTH', 'WALL_ACCESSORY', 'WALLCLOTH_ACCESSORY'],
  },
  {
    label: '墙咔/软包',
    value: 'PANEL',
    categories: ['WALLPANEL', 'SOFT_PACK', 'PANEL_ACCESSORY'],
  },
  {
    label: '软装配套',
    value: 'SOFT',
    categories: ['MATTRESS', 'WINDOWPAD', 'STANDARD'],
  },
  {
    label: '服务与杂项',
    value: 'OTHER',
    categories: ['SERVICE', 'HARDWARE', 'OTHER'],
  },
];

export const getCategoryGroup = (category: string) => {
  return CATEGORY_GROUPS.find((g) => g.categories.includes(category));
};
