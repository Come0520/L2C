'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 创建报价项
export const createQuoteItem = async (data: any) => {
    console.log('Mock createQuoteItem called');
    return { data: { id: 'mock-item-id' } };
};

// Mock 更新报价项
export const updateQuoteItem = async (id: string, data: any) => {
    console.log('Mock updateQuoteItem called');
    return { data: { id } };
};

// Mock 删除报价项
export const deleteQuoteItem = async (id: string) => {
    console.log('Mock deleteQuoteItem called');
    return { data: { success: true } };
};
