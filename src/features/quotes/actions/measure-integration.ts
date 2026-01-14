'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 同步量尺数据到报价
export const syncMeasureToQuote = async (measureId: string, quoteId: string) => {
    console.log('Mock syncMeasureToQuote called');
    return { data: { success: true } };
};

// Mock 从报价创建量尺任务
export const createMeasureFromQuote = async (quoteId: string) => {
    console.log('Mock createMeasureFromQuote called');
    return { data: { measureTaskId: 'mock-measure-id' } };
};
