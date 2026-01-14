'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 报价转订单
export const convertQuoteToOrder = async (quoteId: string) => {
    console.log('Mock convertQuoteToOrder called');
    return { data: { orderId: 'mock-order-id' } };
};

// Mock 报价包转订单
export const convertBundleToOrder = async (bundleId: string) => {
    console.log('Mock convertBundleToOrder called');
    return { data: { orderId: 'mock-order-id' } };
};
