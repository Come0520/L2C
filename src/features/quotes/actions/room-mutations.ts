'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Mock 创建空间
export const createRoom = async (data: any) => {
    console.log('Mock createRoom called');
    return { data: { id: 'mock-room-id' } };
};

// Mock 更新空间
export const updateRoom = async (id: string, data: any) => {
    console.log('Mock updateRoom called');
    return { data: { id } };
};

// Mock 删除空间
export const deleteRoom = async (id: string) => {
    console.log('Mock deleteRoom called');
    return { data: { success: true } };
};
