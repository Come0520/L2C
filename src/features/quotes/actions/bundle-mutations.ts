'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 创建报价包
export const createQuoteBundle = async (data: any) => {
    console.log('Mock createQuoteBundle called');
    return { data: { id: 'mock-bundle-id' } };
};

// Mock 更新报价包
export const updateQuoteBundle = async (id: string, data: any) => {
    console.log('Mock updateQuoteBundle called');
    return { data: { id } };
};

// Mock 提交报价包按钮逻辑
export const submitQuoteBundle = async (id: string) => {
    console.log('Mock submitQuoteBundle called');
    return { data: { success: true } };
};
