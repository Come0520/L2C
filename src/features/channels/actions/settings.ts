'use server';

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

export const attributionSettingsSchema = z.object({
    attributionModel: z.enum(['FIRST_TOUCH', 'LAST_TOUCH']).default('LAST_TOUCH'),
});

export type AttributionSettings = z.infer<typeof attributionSettingsSchema>;

export async function getAttributionSettings(): Promise<AttributionSettings> {
    const session = await auth();
    if (!session?.user?.tenantId) return { attributionModel: 'LAST_TOUCH' };

    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, session.user.tenantId),
        columns: { settings: true }
    });

    const settings = tenant?.settings as Record<string, any>;
    return {
        attributionModel: settings?.channelAttributionModel || 'LAST_TOUCH'
    };
}

export const updateAttributionSettingsAction = createSafeAction(attributionSettingsSchema, async (data, { session }) => {
    const tenantId = session.user.tenantId;

    // Get current settings
    const currentTenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    const currentSettings = (currentTenant?.settings as Record<string, any>) || {};

    // Merge new setting
    const newSettings = {
        ...currentSettings,
        channelAttributionModel: data.attributionModel
    };

    await db.update(tenants)
        .set({ settings: newSettings, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));

    return { success: true };
});
