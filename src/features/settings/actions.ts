'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const mockActionSchema = z.object({
    id: z.string().optional(),
    data: z.any().optional()
});

export const updateUserSettings = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings');
    return { success: true, message: "Settings updated in recovery mode" };
});

export const createUser = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/users');
    return { success: true, message: "User created in recovery mode" };
});

export const updateUser = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/users');
    return { success: true, message: "User updated in recovery mode" };
});

export const deleteUser = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/users');
    return { success: true, message: "User deleted in recovery mode" };
});

export const updateTenantProfile = createSafeAction(mockActionSchema, async (data) => {
    revalidatePath('/settings/general');
    return { success: true, message: "Tenant profile updated in recovery mode" };
});
