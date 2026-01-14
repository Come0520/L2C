'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 创建报价
export const createQuote = async (data: any) => {
    console.log('Mock createQuote called');
    return { data: { id: 'mock-id' } };
};

// Mock 更新报价
export const updateQuote = async (id: string, data: any) => {
    console.log('Mock updateQuote called');
    return { data: { id } };
};

// Mock 删除报价
export const deleteQuote = async (id: string) => {
    console.log('Mock deleteQuote called');
    return { data: { success: true } };
};
