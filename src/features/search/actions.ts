'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

const globalSearchSchema = z.object({
    query: z.string()
});

export const globalSearch = createSafeAction(globalSearchSchema, async ({ query }) => {
    return { success: true, data: [] };
});
