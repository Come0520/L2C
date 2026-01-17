import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
    'CURTAIN_FABRIC',
    'CURTAIN_SHEER',
    'CURTAIN_TRACK',
    'CURTAIN_ACCESSORY',
    'WALLPAPER',
    'WALLCLOTH',
    'WALLPANEL',
    'WINDOWPAD',
    'MOTOR',
    'HARDWARE',
    'OTHER'
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
    'CURTAIN_FABRIC': 'Curtain Fabric',
    'CURTAIN_SHEER': 'Curtain Sheer',
    'CURTAIN_TRACK': 'Curtain Track',
    'CURTAIN_ACCESSORY': 'Accessory',
    'WALLPAPER': 'Wallpaper',
    'WALLCLOTH': 'Wallcloth',
    'WALLPANEL': 'Wallpanel',
    'WINDOWPAD': 'Windowpad',
    'MOTOR': 'Motor',
    'HARDWARE': 'Hardware',
    'OTHER': 'Other'
};
