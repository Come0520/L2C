'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

const globalSearchSchema = z.object({
    query: z.string()
});

const globalSearchActionInternal = createSafeAction(globalSearchSchema, async ({ query: _query }) => {
    return { success: true, data: [] };
});

export async function globalSearch(params: z.infer<typeof globalSearchSchema>) {
    return globalSearchActionInternal(params);
}
