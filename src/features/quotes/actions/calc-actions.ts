'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 重新计算报价
export const recalculateQuote = async (quoteId: string) => {
    console.log('Mock recalculateQuote called');
    return { data: { success: true } };
};

// Mock 获取计算结果预览
export const getCalcPreview = async (data: any) => {
    console.log('Mock getCalcPreview called');
    return { data: { total: 0 } };
};
