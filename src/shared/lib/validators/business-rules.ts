import { z } from 'zod';

export const amountSchema = z.number().min(0, '金额不能为负');
export const quantitySchema = z.number().positive('数量必须大于0');
export const discountRateSchema = z.number().min(0).max(1, '折扣率范围0-1');
export const percentageSchema = z.number().min(0).max(100, '百分比范围0-100');

// 手机号验证 (中国大陆)
export const phoneSchema = z.string().regex(/^\d{8,11}$/, '无效的手机号码');

// UUID 验证
export const uuidSchema = z.string().uuid('无效的 UUID');
